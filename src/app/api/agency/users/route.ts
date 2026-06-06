import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAccount, toErrorResponse, ForbiddenError } from "@/lib/auth/account";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    const ctx = await getCurrentAccount();

    if (!ctx.isAgencyOwner) {
      throw new ForbiddenError("Only agency owners can create users directly.");
    }

    const body = await req.json();
    const { email, password, fullName, workspaceAction, workspaceName, accountId, role } = body;

    if (!email || !password || !fullName || !workspaceAction) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (workspaceAction === "new" && !workspaceName) {
      return NextResponse.json({ error: "Workspace Name is required." }, { status: 400 });
    }

    if (workspaceAction === "existing" && (!accountId || !role)) {
      return NextResponse.json({ error: "Account ID and Role are required for existing workspaces." }, { status: 400 });
    }

    const admin = supabaseAdmin();

    // 1. Create the user using Supabase Auth Admin API
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        workspace_name: workspaceAction === "new" ? workspaceName : undefined
      }
    });

    if (authError || !authData.user) {
      console.error("[POST /api/agency/users] createUser error:", authError);
      return NextResponse.json({ error: authError?.message || "Failed to create user." }, { status: 400 });
    }

    const newUserId = authData.user.id;

    // Wait a brief moment to ensure the `handle_new_user` DB trigger has finished processing.
    // The trigger runs synchronously, but just to be absolutely certain before querying:
    await new Promise(resolve => setTimeout(resolve, 500));

    // If adding to an EXISTING workspace, we need to reassign them and delete the orphaned account created by the trigger.
    if (workspaceAction === "existing") {
      // Find the orphaned account ID
      const { data: profileData, error: profileError } = await admin
        .from("profiles")
        .select("account_id")
        .eq("user_id", newUserId)
        .single();

      if (profileError || !profileData?.account_id) {
        console.error("Failed to find orphaned account:", profileError);
        return NextResponse.json({ error: "User created, but failed to reassign workspace." }, { status: 500 });
      }

      const orphanedAccountId = profileData.account_id;

      // Update the profile to point to the requested target account
      const { error: updateError } = await admin
        .from("profiles")
        .update({ account_id: accountId, account_role: role })
        .eq("user_id", newUserId);

      if (updateError) {
        console.error("Failed to update profile:", updateError);
        return NextResponse.json({ error: "User created, but failed to set role." }, { status: 500 });
      }

      // Delete the orphaned account
      await admin
        .from("accounts")
        .delete()
        .eq("id", orphanedAccountId);
    }

    return NextResponse.json({ success: true, userId: newUserId });
  } catch (err) {
    return toErrorResponse(err);
  }
}

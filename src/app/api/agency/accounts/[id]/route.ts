import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAccount, toErrorResponse, ForbiddenError } from "@/lib/auth/account";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getCurrentAccount();

    if (!ctx.isAgencyOwner) {
      throw new ForbiddenError("Only agency owners can delete accounts.");
    }

    const admin = supabaseAdmin();

    // 1. Fetch all users belonging to this workspace
    const { data: profiles, error: fetchError } = await admin
      .from("profiles")
      .select("user_id")
      .eq("account_id", id);

    if (fetchError) {
      console.error(`[DELETE /api/agency/accounts/${id}] fetch profiles error:`, fetchError);
      return NextResponse.json({ error: "Failed to locate workspace members for deletion." }, { status: 500 });
    }

    // 2. Delete all users completely from Supabase Auth
    // (This guarantees no orphaned logins remain)
    for (const profile of profiles || []) {
      const { error: deleteUserError } = await admin.auth.admin.deleteUser(profile.user_id);
      if (deleteUserError) {
        console.error(`Failed to delete auth user ${profile.user_id}:`, deleteUserError);
      }
    }

    // 3. Delete the account (workspace)
    // This will cascade delete their profiles, contacts, messages, etc.
    const { error: deleteAccountError } = await admin
      .from("accounts")
      .delete()
      .eq("id", id);

    if (deleteAccountError) {
      console.error(`[DELETE /api/agency/accounts/${id}] delete error:`, deleteAccountError);
      return NextResponse.json({ error: "Failed to delete workspace." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}

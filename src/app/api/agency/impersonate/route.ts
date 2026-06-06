import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAccount, toErrorResponse, ForbiddenError } from "@/lib/auth/account";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const ctx = await getCurrentAccount();

    if (!ctx.isAgencyOwner) {
      throw new ForbiddenError("Only agency owners can impersonate accounts.");
    }

    const body = await request.json();
    const targetAccountId = body.accountId;

    if (!targetAccountId) {
      return NextResponse.json({ error: "accountId is required" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    // Verify the target account exists
    const { data: account, error: accountErr } = await admin
      .from("accounts")
      .select("id")
      .eq("id", targetAccountId)
      .single();

    if (accountErr || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Update the agency owner's profile to point to the new account with owner privileges
    const { error: updateErr } = await admin
      .from("profiles")
      .update({
        account_id: targetAccountId,
        account_role: "owner"
      })
      .eq("user_id", ctx.userId);

    if (updateErr) {
      console.error("[POST /api/agency/impersonate] update error:", updateErr);
      return NextResponse.json({ error: "Failed to switch account" }, { status: 500 });
    }

    return NextResponse.json({ success: true, accountId: targetAccountId });
  } catch (err) {
    return toErrorResponse(err);
  }
}

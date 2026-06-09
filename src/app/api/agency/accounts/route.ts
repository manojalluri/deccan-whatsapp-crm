import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAccount, toErrorResponse, ForbiddenError } from "@/lib/auth/account";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const ctx = await getCurrentAccount();

    if (!ctx.isAgencyOwner) {
      throw new ForbiddenError("Only agency owners can list all accounts.");
    }

    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("accounts")
      .select("id, name, created_at, owner_user_id, expires_at, profiles(id)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/agency/accounts] fetch error:", error);
      return NextResponse.json({ error: "Failed to load accounts" }, { status: 500 });
    }

    const accountsWithCounts = data?.map((acc: { id: string, name: string, created_at: string, owner_user_id: string, expires_at: string | null, profiles: { id: string }[] }) => ({
      ...acc,
      memberCount: acc.profiles?.length || 0,
      profiles: undefined, // remove full array from response
    })) ?? [];

    return NextResponse.json({ accounts: accountsWithCounts });
  } catch (err) {
    return toErrorResponse(err);
  }
}

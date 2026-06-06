import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAccount, toErrorResponse, ForbiddenError } from "@/lib/auth/account";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getCurrentAccount();

    if (!ctx.isAgencyOwner) {
      throw new ForbiddenError("Only agency owners can list account members.");
    }

    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("profiles")
      .select("id, full_name, email, account_role, is_agency_owner")
      .eq("account_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(`[GET /api/agency/accounts/${id}/members] fetch error:`, error);
      return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
    }

    return NextResponse.json({ members: data });
  } catch (err) {
    return toErrorResponse(err);
  }
}

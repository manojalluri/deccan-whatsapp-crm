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
      throw new ForbiddenError("Only agency owners can delete users.");
    }

    const admin = supabaseAdmin();

    // Delete the user completely from Supabase Auth.
    // Their profile row will NOT automatically cascade delete if the FK 
    // is from profiles -> auth.users without ON DELETE CASCADE.
    // Wait, let's explicitly delete the profile first to be safe,
    // though auth.users usually cascade deletes its profiles.
    await admin.from("profiles").delete().eq("user_id", id);

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(id);

    if (deleteUserError) {
      console.error(`[DELETE /api/agency/users/${id}] auth delete error:`, deleteUserError);
      return NextResponse.json({ error: "Failed to delete user account." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}

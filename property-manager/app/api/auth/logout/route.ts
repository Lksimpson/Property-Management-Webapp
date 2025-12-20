import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    // Attempt to sign out; this may throw if env/config is incorrect.
    await supabase.auth.signOut();
  } catch (err) {
    // Log server-side for debugging (Vercel function logs).
    console.error("Error during logout:", err);
    // Continue to redirect to login even on error to avoid surfacing a 500 to users.
  }

  return NextResponse.redirect('/login');
}

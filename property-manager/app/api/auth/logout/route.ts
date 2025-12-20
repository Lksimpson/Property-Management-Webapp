import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export async function GET() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  // Use a relative redirect to avoid sending users to a hardcoded origin
  // (which can be localhost in dev env vars) — keeps the redirect on the same host.
  return NextResponse.redirect('/login');
}

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

async function performSignOut() {
  try {
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
    return { ok: true };
  } catch (err) {
    console.error("Error during logout:", err);
    return { ok: false, error: (err as any)?.message ?? String(err) };
  }
}

export async function GET(request: Request) {
  // If the request is an RSC prefetch (Next adds _rsc), return JSON instead of redirect
  const url = new URL(request.url);
  const isRsc = url.searchParams.has("_rsc");

  const result = await performSignOut();

  if (isRsc) {
    return NextResponse.json(result);
  }

  // For a normal browser navigation, redirect to the login page.
  return NextResponse.redirect("/login");
}

export async function POST() {
  const result = await performSignOut();
  return NextResponse.json(result);
}

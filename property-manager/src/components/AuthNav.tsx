"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase/client";

export default function AuthNav() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      try {
        listener.subscription.unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout");
    router.refresh();
    router.push("/login");
  };

  return (
    <header className="border-b p-4">
      <div className="mx-auto max-w-5xl flex items-center justify-between">
        <Link href="/" className="font-semibold">
          Property Manager
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm">Signed in as {user.email}</span>
              <button onClick={handleLogout} className="rounded bg-black px-3 py-1 text-white">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm">
                Sign in
              </Link>
              <Link href="/signup" className="text-sm">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

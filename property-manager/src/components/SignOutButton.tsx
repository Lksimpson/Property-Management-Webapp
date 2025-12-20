"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase/client";
import { useState } from "react";

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      // Sign out on the browser client first to clear client-side session/localStorage
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Client signOut error:", err);
    }

    try {
      // Then call the server endpoint to clear any server-side cookies (no-op if none).
      // Use POST and include credentials so the server receives cookies when present.
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (err) {
      console.error('Server logout call failed:', err);
    }

    setLoading(false);
    router.push('/login');
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-500 hover:bg-slate-800/60"
    >
      {loading ? 'Signing out...' : 'Sign out'}
    </button>
  );
}

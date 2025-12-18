"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase/client";
import AuthCard from "@/src/components/AuthCard";
import FormInput from "@/src/components/FormInput";
import FormButton from "@/src/components/FormButton";

export default function ResetUpdatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Parse the URL and restore session from the link Supabase sent.
    (async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (!session) {
        setError("No valid session found");
        setLoading(false);
        return;
      }
      setReady(true);
      setLoading(false);
    })();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // respect optional redirectTo in query if present
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirectTo") || "/dashboard";
    router.push(redirectTo);
  };

  if (loading) {
    return <div className="p-8">Processing reset link...</div>;
  }

  if (!ready) {
    return <div className="p-8">Invalid or expired link. Try requesting a new reset.</div>;
  }

  return (
    <AuthCard title="Set a new password">
      <form onSubmit={handleUpdate} className="flex flex-col gap-4">
        <FormInput
          aria-label="New password"
          placeholder="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FormButton type="submit" disabled={loading}>
          {loading ? "Updating..." : "Set password"}
        </FormButton>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </AuthCard>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase/client";
import AuthCard from "@/src/components/AuthCard";
import FormInput from "@/src/components/FormInput";
import FormButton from "@/src/components/FormButton";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // honor optional redirectTo query param so callers can send users back
    const urlParams = new URLSearchParams(window.location.search);
    const redirectToParam = urlParams.get("redirectTo");
    const emailRedirectTo =
      redirectToParam || (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` : undefined);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage(
      "Check your email for a confirmation link (if your Supabase project requires verification)."
    );
    // Optionally auto-redirect to login
    setTimeout(() => router.push("/login"), 2500);
  };

  return (
    <AuthCard title="Create account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormInput
          aria-label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormInput
          aria-label="Password"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FormButton type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </FormButton>
        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </AuthCard>
  );
}

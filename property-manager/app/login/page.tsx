"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/src/lib/supabase/client";
import AuthCard from "@/src/components/AuthCard";
import FormInput from "@/src/components/FormInput";
import FormButton from "@/src/components/FormButton";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirectTo") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push(redirectTo);
  };

  return (
    <AuthCard title="Sign in">
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
          {loading ? "Signing in..." : "Sign in"}
        </FormButton>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </AuthCard>
  );
}

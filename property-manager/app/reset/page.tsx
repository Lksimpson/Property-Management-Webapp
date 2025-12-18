"use client";

import { useState } from "react";
import { supabase } from "@/src/lib/supabase/client";
import AuthCard from "@/src/components/AuthCard";
import FormInput from "@/src/components/FormInput";
import FormButton from "@/src/components/FormButton";

export default function ResetRequestPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const urlParams = new URLSearchParams(window.location.search);
    const redirectToParam = urlParams.get("redirectTo");
    const redirectTo =
      redirectToParam || (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/reset/update` : undefined);

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Check your email for a password reset link.");
  };

  return (
    <AuthCard title="Reset password">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormInput
          aria-label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormButton type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </FormButton>
        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </AuthCard>
  );
}

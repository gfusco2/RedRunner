"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "lib/supabase/client";

type Mode = "signin" | "signup" | "reset";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const fromUrl = searchParams.get("error");
    if (fromUrl) setError(fromUrl);
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const trimmedEmail = email.trim().toLowerCase();

    startTransition(async () => {
      try {
        const supabase = createClient();
        const origin = window.location.origin;

        if (mode === "reset") {
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            trimmedEmail,
            {
              redirectTo: `${origin}/auth/update-password`,
            }
          );
          if (resetError) throw resetError;
          setMessage(
            "Password reset email sent. Open the newest link in this same browser (not another device)."
          );
          return;
        }

        if (mode === "signup") {
          const { error: signUpError } = await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
              emailRedirectTo: `${origin}/auth/confirm?next=/settings`,
            },
          });
          if (signUpError) throw signUpError;
          setMessage(
            "Account created. Check your email to confirm, then sign in with the same password."
          );
          setMode("signin");
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) throw signInError;

        await fetch("/auth/ensure-profile", { method: "POST" });
        window.location.href = "/settings";
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-4">
      <div>
        <label className="label-field">Email</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          placeholder="you@example.com"
        />
      </div>

      {mode !== "reset" && (
        <div>
          <label className="label-field">Password</label>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder="••••••••"
          />
        </div>
      )}

      {error && <p className="text-sm text-brand-600">{error}</p>}
      {message && <p className="text-sm text-ink-600">{message}</p>}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending
          ? "Working…"
          : mode === "signin"
            ? "Sign in"
            : mode === "signup"
              ? "Create account"
              : "Send reset email"}
      </button>

      {mode === "signin" && (
        <button
          type="button"
          className="w-full text-sm text-ink-500 hover:text-brand-600"
          onClick={() => {
            setMode("reset");
            setError(null);
            setMessage(null);
          }}
        >
          Forgot password?
        </button>
      )}

      <button
        type="button"
        className="w-full text-sm text-ink-500 hover:text-brand-600"
        onClick={() => {
          setMode(mode === "signup" ? "signin" : "signup");
          setError(null);
          setMessage(null);
        }}
      >
        {mode === "signup"
          ? "Already have an account? Sign in"
          : "Need an account? Sign up"}
      </button>
    </form>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "lib/supabase/client";

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function establishSession() {
      const supabase = createClient();
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (!cancelled) {
            setError(
              `${exchangeError.message} Request a new reset email from this same browser, then open the link here (not in another app’s browser).`
            );
          }
          return;
        }
        // Clean code out of the URL
        window.history.replaceState({}, "", "/auth/update-password");
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (!cancelled) {
          setError(
            "No recovery session yet. Use Forgot password on the login page, then open the newest email link in this browser."
          );
        }
        return;
      }

      if (!cancelled) setReady(true);
    }

    void establishSession();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });
        if (updateError) throw updateError;
        await fetch("/auth/ensure-profile", { method: "POST" });
        window.location.href = "/settings";
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not update password."
        );
      }
    });
  }

  if (!ready && !error) {
    return <p className="text-sm text-ink-500">Confirming reset link…</p>;
  }

  if (!ready && error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-brand-600">{error}</p>
        <a href="/login" className="btn-primary inline-block">
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-4">
      <div>
        <label className="label-field">New password</label>
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />
      </div>
      <div>
        <label className="label-field">Confirm password</label>
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="input-field"
        />
      </div>
      {error && <p className="text-sm text-brand-600">{error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "app/actions/auth";

type Props = {
  initialName: string;
  email: string;
  role: string;
};

export default function ProfileForm({ initialName, email, role }: Props) {
  const [name, setName] = useState(initialName);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await updateProfile({ name });
        setMessage("Profile saved.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-ink-100 bg-white p-5 shadow-soft"
    >
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Profile</h2>
        <p className="mt-1 text-sm text-ink-500">
          Signed in as {email} · role{" "}
          <span className="font-medium text-ink-700">{role}</span>
        </p>
      </div>
      <div>
        <label className="label-field">Display name</label>
        <input
          className="input-field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </div>
      {error && <p className="text-sm text-brand-600">{error}</p>}
      {message && <p className="text-sm text-ink-600">{message}</p>}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

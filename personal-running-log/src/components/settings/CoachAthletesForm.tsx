"use client";

import { useState, useTransition } from "react";
import type { User } from "@prisma/client";
import { linkAthleteByEmail, unlinkAthlete } from "app/actions/coaching";

type Props = {
  athletes: User[];
};

export default function CoachAthletesForm({ athletes }: Props) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const athlete = await linkAthleteByEmail(email);
        setMessage(`Linked ${athlete.email}.`);
        setEmail("");
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not link.");
      }
    });
  }

  function handleUnlink(athleteId: string) {
    startTransition(async () => {
      await unlinkAthlete(athleteId);
      window.location.reload();
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-ink-100 bg-white p-5 shadow-soft">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Athletes</h2>
        <p className="mt-1 text-sm text-ink-500">
          Link people who already have a RedRunner account (by email). You can
          view their log and set weekly mileage plans.
        </p>
      </div>

      <form onSubmit={handleLink} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          className="input-field flex-1"
          placeholder="athlete@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Linking…" : "Link athlete"}
        </button>
      </form>
      {error && <p className="text-sm text-brand-600">{error}</p>}
      {message && <p className="text-sm text-trail-700">{message}</p>}

      {athletes.length === 0 ? (
        <p className="text-sm text-ink-500">No athletes linked yet.</p>
      ) : (
        <ul className="divide-y divide-ink-100 rounded-lg border border-ink-100">
          {athletes.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <div>
                <p className="font-medium text-ink-900">
                  {a.name?.trim() || a.email}
                </p>
                <p className="text-xs text-ink-500">{a.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`/coach/${a.id}`}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-800"
                >
                  Open
                </a>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleUnlink(a.id)}
                  className="text-xs text-ink-500 hover:text-brand-700"
                >
                  Unlink
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import type { DayWellness } from "@prisma/client";
import { getDayWellness, upsertDayWellness } from "app/actions/wellness";

const STRENGTH_OPTIONS = ["Core", "Full body", "Legs", "Upper", "Other"];
const STRETCH_OPTIONS = ["Yoga", "Hips", "Full stretch", "Mobility", "Other"];

type Props = {
  dateKey: string;
};

export default function DayWellnessForm({ dateKey }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [strengthDone, setStrengthDone] = useState(false);
  const [strengthFocus, setStrengthFocus] = useState("");
  const [stretchDone, setStretchDone] = useState(false);
  const [stretchFocus, setStretchFocus] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    getDayWellness(dateKey).then((row: DayWellness | null) => {
      if (cancelled) return;
      setStrengthDone(row?.strengthDone ?? false);
      setStrengthFocus(row?.strengthFocus ?? "");
      setStretchDone(row?.stretchDone ?? false);
      setStretchFocus(row?.stretchFocus ?? "");
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await upsertDayWellness({
          dateKey,
          strengthDone,
          strengthFocus: strengthDone ? strengthFocus : null,
          stretchDone,
          stretchFocus: stretchDone ? stretchFocus : null,
        });
        setMessage("Wellness saved.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save.");
      }
    });
  }

  if (!loaded) {
    return (
      <p className="rounded-lg border border-ink-100 bg-white px-3 py-4 text-sm text-ink-500">
        Loading wellness…
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-ink-100 bg-white p-3">
      <h3 className="text-sm font-semibold text-ink-900">Day wellness</h3>
      <p className="mt-0.5 text-xs text-ink-500">
        Strength and stretch — separate from mileage.
      </p>

      <div className="mt-3 space-y-3">
        <div className="rounded-md border border-trail-100 bg-trail-50 p-2.5">
          <label className="flex items-center gap-2 text-sm font-medium text-trail-700">
            <input
              type="checkbox"
              checked={strengthDone}
              onChange={(e) => setStrengthDone(e.target.checked)}
              className="rounded border-ink-300"
            />
            Strength
          </label>
          {strengthDone && (
            <select
              className="input-field mt-2"
              value={strengthFocus}
              onChange={(e) => setStrengthFocus(e.target.value)}
            >
              <option value="">What kind?</option>
              {STRENGTH_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="rounded-md border border-sky-100 bg-sky-50 p-2.5">
          <label className="flex items-center gap-2 text-sm font-medium text-sky-700">
            <input
              type="checkbox"
              checked={stretchDone}
              onChange={(e) => setStretchDone(e.target.checked)}
              className="rounded border-ink-300"
            />
            Stretch / Yoga
          </label>
          {stretchDone && (
            <select
              className="input-field mt-2"
              value={stretchFocus}
              onChange={(e) => setStretchFocus(e.target.value)}
            >
              <option value="">What kind?</option>
              {STRETCH_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-brand-600">{error}</p>}
      {message && <p className="mt-2 text-xs text-trail-700">{message}</p>}

      <button
        type="button"
        disabled={pending}
        onClick={save}
        className="btn-ghost mt-3 w-full"
      >
        {pending ? "Saving…" : "Save wellness"}
      </button>
    </div>
  );
}

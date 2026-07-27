"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { WeekPlan } from "@prisma/client";
import { upsertWeekPlan } from "app/actions/weekPlans";
import { kmToMiles, milesToKm } from "lib/training/format";
import { usePreferences } from "lib/preferences";
import { formatWeekLabel, parseDateKey } from "lib/training/dates";
import {
  DEFAULT_GOAL_RANGE_MILES,
  goalBand,
  resolveGoalRange,
} from "lib/training/goals";

type Props = {
  weekStartKey: string;
  initial: WeekPlan | null;
  athleteId?: string;
  /** Compact layout for calendar side panel / inline. */
  compact?: boolean;
  onSaved?: () => void;
  onCancel?: () => void;
};

function displayMiles(miles: number | null | undefined, unit: "mi" | "km") {
  if (miles == null) return "";
  return unit === "km"
    ? String(milesToKm(miles).toFixed(1))
    : String(miles);
}

export default function WeekGoalEditor({
  weekStartKey,
  initial,
  athleteId,
  compact = false,
  onSaved,
  onCancel,
}: Props) {
  const router = useRouter();
  const { unit } = usePreferences();
  const unitLabel = unit === "km" ? "km" : "mi";

  const [miles, setMiles] = useState(displayMiles(initial?.goalRunMiles, unit));
  const [range, setRange] = useState(
    displayMiles(
      initial?.goalRunMiles != null
        ? resolveGoalRange(initial.goalRangeMiles)
        : DEFAULT_GOAL_RANGE_MILES,
      unit
    )
  );
  const [runDays, setRunDays] = useState(
    initial?.runDays != null ? String(initial.runDays) : ""
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setMiles(displayMiles(initial?.goalRunMiles, unit));
    setRange(
      displayMiles(
        initial?.goalRunMiles != null
          ? resolveGoalRange(initial.goalRangeMiles)
          : DEFAULT_GOAL_RANGE_MILES,
        unit
      )
    );
    setRunDays(initial?.runDays != null ? String(initial.runDays) : "");
    setNotes(initial?.notes ?? "");
    setMessage(null);
    setError(null);
  }, [weekStartKey, initial, unit]);

  function toStoredMiles(raw: string): number | null {
    const n = Number(raw);
    if (!raw.trim() || !Number.isFinite(n) || n <= 0) return null;
    return unit === "km" ? kmToMiles(n) : n;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const goalRunMiles = toStoredMiles(miles);
        let goalRangeMiles: number | null = null;
        if (goalRunMiles != null) {
          const r = toStoredMiles(range);
          goalRangeMiles = r != null ? r : DEFAULT_GOAL_RANGE_MILES;
        }
        await upsertWeekPlan({
          weekStartKey,
          athleteId,
          goalRunMiles,
          goalRangeMiles,
          runDays: runDays.trim() ? Number(runDays) : null,
          notes,
        });
        setMessage("Saved.");
        router.refresh();
        onSaved?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save.");
      }
    });
  }

  const previewMiles = goalBand(
    toStoredMiles(miles) ?? undefined,
    toStoredMiles(range) ?? DEFAULT_GOAL_RANGE_MILES
  );
  const preview = previewMiles
    ? unit === "km"
      ? {
          low: milesToKm(previewMiles.low),
          high: milesToKm(previewMiles.high),
          goal: milesToKm(previewMiles.goal),
          range: milesToKm(previewMiles.range),
        }
      : previewMiles
    : null;

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-2" : "space-y-3"}>
      {!compact && (
        <p className="text-xs text-ink-500">
          {formatWeekLabel(parseDateKey(weekStartKey))}
        </p>
      )}
      <div
        className={`grid gap-2 ${compact ? "grid-cols-2" : "sm:grid-cols-3"}`}
      >
        <div>
          <label className="label-field">Goal ({unitLabel})</label>
          <input
            type="number"
            step="0.1"
            min="0"
            className="input-field"
            value={miles}
            onChange={(e) => setMiles(e.target.value)}
            placeholder="35"
          />
        </div>
        <div>
          <label className="label-field">± range</label>
          <input
            type="number"
            step="0.1"
            min="0"
            className="input-field"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder={String(DEFAULT_GOAL_RANGE_MILES)}
          />
        </div>
        {!compact && (
          <div>
            <label className="label-field">Run days</label>
            <input
              type="number"
              min="1"
              max="7"
              step="1"
              className="input-field"
              value={runDays}
              onChange={(e) => setRunDays(e.target.value)}
              placeholder="4"
            />
          </div>
        )}
      </div>
      {preview && (
        <p className="text-[11px] text-ink-500">
          Band{" "}
          <span className="font-medium text-ink-700">
            {preview.low.toFixed(0)}–{preview.high.toFixed(0)} {unitLabel}
          </span>
        </p>
      )}
      {!compact && (
        <div>
          <label className="label-field">Notes / structure</label>
          <textarea
            rows={3}
            className="input-field"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="10 mi long on weekend · 1 workout midweek"
          />
        </div>
      )}
      {compact && (
        <div>
          <label className="label-field">Notes</label>
          <textarea
            rows={2}
            className="input-field"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Structure notes (optional)"
          />
        </div>
      )}
      {error && <p className="text-xs text-brand-600">{error}</p>}
      {message && <p className="text-xs text-trail-700">{message}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary flex-1">
          {pending ? "Saving…" : "Save goal"}
        </button>
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

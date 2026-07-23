"use client";

import { useEffect, useState, useTransition } from "react";
import type { WeekPlan } from "@prisma/client";
import { upsertWeekPlan } from "app/actions/weekPlans";
import { kmToMiles, milesToKm } from "lib/training/format";
import { usePreferences } from "lib/preferences";
import {
  addWeeks,
  formatWeekLabel,
  parseDateKey,
  toDateKey,
} from "lib/training/dates";
import {
  DEFAULT_GOAL_RANGE_MILES,
  goalBand,
  resolveGoalRange,
} from "lib/training/goals";

type Props = {
  /** Monday of the "this week" / block start. */
  baseWeekStartKey: string;
  /** Existing plans keyed by weekStart date key (YYYY-MM-DD). */
  plansByWeek: Record<string, WeekPlan>;
  athleteId?: string;
  /** How many weeks ahead to edit (including base). Default 4. */
  weekCount?: number;
};

function displayMiles(miles: number | null | undefined, unit: "mi" | "km") {
  if (miles == null) return "";
  return unit === "km"
    ? String(milesToKm(miles).toFixed(1))
    : String(miles);
}

export default function WeekPlanForm({
  baseWeekStartKey,
  plansByWeek,
  athleteId,
  weekCount = 4,
}: Props) {
  const { unit } = usePreferences();
  const unitLabel = unit === "km" ? "km" : "mi";
  const weekKeys = Array.from({ length: weekCount }, (_, i) =>
    toDateKey(addWeeks(parseDateKey(baseWeekStartKey), i))
  );

  const [selectedKey, setSelectedKey] = useState(baseWeekStartKey);
  const plan = plansByWeek[selectedKey] ?? null;

  const [miles, setMiles] = useState(displayMiles(plan?.goalRunMiles, unit));
  const [range, setRange] = useState(
    displayMiles(
      plan?.goalRunMiles != null
        ? resolveGoalRange(plan.goalRangeMiles)
        : DEFAULT_GOAL_RANGE_MILES,
      unit
    )
  );
  const [runDays, setRunDays] = useState(
    plan?.runDays != null ? String(plan.runDays) : ""
  );
  const [notes, setNotes] = useState(plan?.notes ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const next = plansByWeek[selectedKey] ?? null;
    setMiles(displayMiles(next?.goalRunMiles, unit));
    setRange(
      displayMiles(
        next?.goalRunMiles != null
          ? resolveGoalRange(next.goalRangeMiles)
          : DEFAULT_GOAL_RANGE_MILES,
        unit
      )
    );
    setRunDays(next?.runDays != null ? String(next.runDays) : "");
    setNotes(next?.notes ?? "");
    setMessage(null);
    setError(null);
  }, [selectedKey, plansByWeek, unit]);

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
          goalRangeMiles =
            r != null ? r : DEFAULT_GOAL_RANGE_MILES;
        }
        await upsertWeekPlan({
          weekStartKey: selectedKey,
          athleteId,
          goalRunMiles,
          goalRangeMiles,
          runDays: runDays.trim() ? Number(runDays) : null,
          notes,
        });
        setMessage("Week plan saved.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save plan.");
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
  const selectedIndex = weekKeys.indexOf(selectedKey);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-ink-100 bg-white p-4 shadow-soft"
    >
      <h2 className="text-lg font-semibold text-ink-900">Week plan</h2>
      <p className="text-xs text-ink-500">
        Set goal mileage weeks ahead — planned workouts can come later.
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {weekKeys.map((key, i) => {
          const existing = plansByWeek[key];
          const active = key === selectedKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedKey(key)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-brand-600 text-white"
                  : "bg-ink-50 text-ink-700 hover:bg-ink-100"
              }`}
            >
              W{i + 1}
              {existing?.goalRunMiles != null ? (
                <span className={active ? "text-brand-100" : "text-ink-400"}>
                  {" "}
                  · {existing.goalRunMiles.toFixed(0)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-ink-500">
        {formatWeekLabel(parseDateKey(selectedKey))}
        {selectedIndex === 0 ? " · this week" : ""}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label-field">Goal mileage ({unitLabel})</label>
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
          <label className="label-field">± range ({unitLabel})</label>
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
      </div>
      {preview && (
        <p className="mt-2 text-xs text-ink-500">
          Target band:{" "}
          <span className="font-medium text-ink-700">
            {preview.low.toFixed(0)}–{preview.high.toFixed(0)} {unitLabel}
          </span>{" "}
          (goal {preview.goal.toFixed(0)} ± {preview.range.toFixed(0)})
        </p>
      )}
      <div className="mt-3">
        <label className="label-field">Notes / structure</label>
        <textarea
          rows={3}
          className="input-field"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="10 mi long on weekend · 1 workout midweek · strides day before"
        />
      </div>
      {error && <p className="mt-2 text-sm text-brand-600">{error}</p>}
      {message && <p className="mt-2 text-sm text-trail-700">{message}</p>}
      <button type="submit" disabled={pending} className="btn-primary mt-3">
        {pending ? "Saving…" : "Save week plan"}
      </button>
    </form>
  );
}

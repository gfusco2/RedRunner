"use client";

import { formatDistance } from "lib/training/format";
import { usePreferences } from "lib/preferences";
import type { DayTotals } from "lib/training/totals";
import type { TagMiles } from "lib/training/analytics";
import type { GoalBand } from "lib/training/goals";
import { TAG_LABELS, TAG_PILL_CLASS } from "lib/training/tags";

type CompareProps = {
  thisWeek: DayTotals;
  lastWeek: DayTotals;
  goal?: GoalBand | null;
};

export function WeekCompareCards({
  thisWeek,
  lastWeek,
  goal,
}: CompareProps) {
  const { unit } = usePreferences();
  const delta = thisWeek.runMiles - lastWeek.runMiles;
  const deltaLabel =
    delta === 0
      ? "Same as last week"
      : `${delta > 0 ? "+" : ""}${formatDistance(Math.abs(delta), unit)} vs last week`;

  const inBand =
    goal != null &&
    thisWeek.runMiles >= goal.low &&
    thisWeek.runMiles <= goal.high;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          Actual this week
        </p>
        <p className="mt-1 text-2xl font-semibold text-ink-900">
          {formatDistance(thisWeek.runMiles, unit)}
        </p>
        <p className="mt-1 text-xs text-ink-500">{deltaLabel}</p>
      </div>
      <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          Last week
        </p>
        <p className="mt-1 text-2xl font-semibold text-ink-900">
          {formatDistance(lastWeek.runMiles, unit)}
        </p>
      </div>
      <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Goal vs actual
        </p>
        <p className="mt-1 text-2xl font-semibold text-brand-800">
          {goal
            ? `${formatDistance(thisWeek.runMiles, unit)} / ${formatDistance(goal.goal, unit)}`
            : formatDistance(thisWeek.runMiles, unit)}
        </p>
        <p className="mt-1 text-xs text-brand-700">
          {goal
            ? inBand
              ? `In band (${formatDistance(goal.low, unit)}–${formatDistance(goal.high, unit)})`
              : `Band ${formatDistance(goal.low, unit)}–${formatDistance(goal.high, unit)}`
            : "Set a weekly goal below"}
        </p>
        {thisWeek.plannedRunMiles > 0 && (
          <p className="mt-1 text-[10px] text-brand-600 opacity-80">
            Planned on calendar:{" "}
            {formatDistance(thisWeek.plannedRunMiles, unit)}
          </p>
        )}
      </div>
    </div>
  );
}

type TagProps = {
  rows: TagMiles[];
};

export function MilesByTagCard({ rows }: TagProps) {
  const { unit } = usePreferences();
  const max = Math.max(...rows.map((r) => r.miles), 0.1);

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-soft">
      <h2 className="text-lg font-semibold text-ink-900">Miles by tag</h2>
      <p className="text-xs text-ink-500">This week · completed runs</p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-ink-500">
          Tag some runs to see the split.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.tag}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${TAG_PILL_CLASS[row.tag]}`}
                >
                  {TAG_LABELS[row.tag]}
                </span>
                <span className="text-sm font-medium text-ink-900">
                  {formatDistance(row.miles, unit)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${(row.miles / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { formatDistance } from "lib/training/format";
import { usePreferences } from "lib/preferences";
import type { DayTotals } from "lib/training/totals";
import type { GoalBand } from "lib/training/goals";

type Props = {
  totals: DayTotals;
  goal?: GoalBand | null;
};

export default function DashboardSummaryCards({ totals, goal }: Props) {
  const { unit } = usePreferences();
  const zero = unit === "km" ? "0.0 km" : "0.0 mi";

  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-4">
      <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Actual
        </p>
        <p className="mt-1 text-2xl font-semibold text-brand-800">
          {totals.runMiles > 0 ? formatDistance(totals.runMiles, unit) : zero}
        </p>
      </div>
      <div className="rounded-xl border border-ink-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">
          Goal
        </p>
        <p className="mt-1 text-2xl font-semibold text-ink-900">
          {goal ? formatDistance(goal.goal, unit) : zero}
        </p>
        {goal && (
          <p className="mt-1 text-xs text-ink-500">
            {formatDistance(goal.low, unit)}–{formatDistance(goal.high, unit)}
          </p>
        )}
      </div>
      <div className="rounded-xl border border-ink-100 bg-white p-4 opacity-80">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
          Planned
        </p>
        <p className="mt-1 text-xl font-medium text-ink-500">
          {totals.plannedRunMiles > 0
            ? formatDistance(totals.plannedRunMiles, unit)
            : zero}
        </p>
        <p className="mt-1 text-[10px] text-ink-400">On the calendar</p>
      </div>
      <div className="rounded-xl border border-ink-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          Bike / X-train
        </p>
        <p className="mt-1 text-sm font-medium text-ink-800">
          Bike{" "}
          {totals.bikeSeconds > 0
            ? `${Math.round(totals.bikeSeconds / 60)}m`
            : "—"}
        </p>
        <p className="mt-0.5 text-sm font-medium text-ink-800">
          X-train{" "}
          {totals.xtrainSeconds > 0
            ? `${Math.round(totals.xtrainSeconds / 60)}m`
            : "—"}
        </p>
      </div>
    </div>
  );
}

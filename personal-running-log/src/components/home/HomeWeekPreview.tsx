"use client";

import { formatDistance } from "lib/training/format";
import { usePreferences } from "lib/preferences";
import type { GoalBand } from "lib/training/goals";

type Props = {
  actualMiles: number;
  plannedMiles: number;
  goal: GoalBand | null;
  weekLabel: string;
};

export default function HomeWeekPreview({
  actualMiles,
  plannedMiles,
  goal,
  weekLabel,
}: Props) {
  const { unit } = usePreferences();
  const zero = unit === "km" ? "0.0 km" : "0.0 mi";

  return (
    <div className="w-full">
      <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
        This week · {weekLabel}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-lg bg-brand-600 px-3 py-4 text-center text-white">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-100">
            Actual
          </p>
          <p className="mt-1 text-lg font-semibold sm:text-xl">
            {actualMiles > 0 ? formatDistance(actualMiles, unit) : zero}
          </p>
        </div>
        <div className="rounded-lg border border-ink-200 bg-white px-3 py-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
            Goal
          </p>
          <p className="mt-1 text-lg font-semibold text-ink-900 sm:text-xl">
            {goal ? formatDistance(goal.goal, unit) : zero}
          </p>
          {goal && (
            <p className="mt-0.5 text-[10px] text-ink-400">
              {formatDistance(goal.low, unit)}–{formatDistance(goal.high, unit)}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-ink-100 bg-white bg-opacity-70 px-3 py-4 text-center opacity-80">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
            Planned
          </p>
          <p className="mt-1 text-base font-medium text-ink-500 sm:text-lg">
            {plannedMiles > 0 ? formatDistance(plannedMiles, unit) : zero}
          </p>
        </div>
      </div>
    </div>
  );
}

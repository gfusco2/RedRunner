"use client";

import { formatDistance, formatDurationLong } from "lib/training/format";
import { usePreferences } from "lib/preferences";
import type { DayTotals } from "lib/training/totals";

type Props = {
  totals: DayTotals;
};

export default function DashboardSummaryCards({ totals }: Props) {
  const { unit } = usePreferences();
  const zero = unit === "km" ? "0.0 km" : "0.0 mi";

  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-4">
      <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Completed
        </p>
        <p className="mt-1 text-2xl font-semibold text-brand-800">
          {totals.runMiles > 0 ? formatDistance(totals.runMiles, unit) : zero}
        </p>
      </div>
      <div className="rounded-xl border border-brand-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">
          Planned
        </p>
        <p className="mt-1 text-2xl font-semibold text-brand-500">
          {totals.plannedRunMiles > 0
            ? formatDistance(totals.plannedRunMiles, unit)
            : zero}
        </p>
      </div>
      <div className="rounded-xl border border-ink-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          Bike time
        </p>
        <p className="mt-1 text-2xl font-semibold text-ink-900">
          {formatDurationLong(totals.bikeSeconds)}
        </p>
      </div>
      <div className="rounded-xl border border-ink-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          X-Train time
        </p>
        <p className="mt-1 text-2xl font-semibold text-ink-900">
          {formatDurationLong(totals.xtrainSeconds)}
        </p>
      </div>
    </div>
  );
}

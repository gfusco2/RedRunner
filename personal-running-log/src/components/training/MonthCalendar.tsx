"use client";

import type { Activity } from "@prisma/client";
import { useState } from "react";
import {
  groupActivitiesByDate,
  hasAnyTotals,
  totalsForActivities,
  type DayTotals,
} from "lib/training/totals";
import { WEEKDAY_LABELS, formatWeekLabel, parseDateKey } from "lib/training/dates";
import { formatDistance } from "lib/training/format";
import { usePreferences } from "lib/preferences";
import DayTotalsDisplay from "./DayTotalsDisplay";
import DayDetailPanel from "./DayDetailPanel";

export type CalendarWeek = {
  weekStartKey: string;
  weekDays: string[];
  weekTotals: DayTotals;
  /** Real current week — ~30% taller + red tint (moves in the stack as you navigate) */
  emphasized?: boolean;
};

type MonthCalendarProps = {
  weeks: CalendarWeek[];
  activities: Activity[];
  todayKey: string;
  periodTotals: DayTotals;
};

export default function MonthCalendar({
  weeks,
  activities,
  todayKey,
  periodTotals,
}: MonthCalendarProps) {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const byDate = groupActivitiesByDate(activities);
  const { unit } = usePreferences();
  const zeroLabel = unit === "km" ? "0.0 km" : "0.0 mi";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-soft">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
            Completed
          </p>
          <p className="text-xl font-semibold text-brand-700">
            {periodTotals.runMiles > 0
              ? formatDistance(periodTotals.runMiles, unit)
              : zeroLabel}
          </p>
        </div>
        <div className="h-8 w-px bg-ink-100" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
            Planned
          </p>
          <p className="text-xl font-semibold text-brand-400">
            {periodTotals.plannedRunMiles > 0
              ? formatDistance(periodTotals.plannedRunMiles, unit)
              : zeroLabel}
          </p>
        </div>
        <div className="h-8 w-px bg-ink-100" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
            Combined
          </p>
          <p className="text-xl font-semibold text-ink-900">
            {formatDistance(
              periodTotals.runMiles + periodTotals.plannedRunMiles,
              unit
            )}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[780px] space-y-4">
          <div className="grid grid-cols-8 gap-2 px-0.5">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="px-1 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-500"
              >
                {label}
              </div>
            ))}
            <div className="px-1 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              Week
            </div>
          </div>

          {weeks.map((week) => {
            const tall = Boolean(week.emphasized);
            // Other weeks ~140px; focus week ~30% taller (~182px)
            const cellMin = tall ? "min-h-[182px]" : "min-h-[140px]";

            return (
              <div
                key={week.weekStartKey}
                className={
                  tall
                    ? "rounded-2xl border border-brand-200 bg-brand-50/60 p-3 ring-1 ring-brand-100"
                    : undefined
                }
              >
                <p className="mb-1.5 text-xs font-medium text-ink-500">
                  {formatWeekLabel(parseDateKey(week.weekStartKey))}
                  {tall && (
                    <span className="ml-2 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                      Current week
                    </span>
                  )}
                </p>
                <div className="grid grid-cols-8 gap-2">
                  {week.weekDays.map((dateKey) => {
                    const date = new Date(dateKey + "T12:00:00");
                    const totals = totalsForActivities(byDate[dateKey] ?? []);
                    const isToday = dateKey === todayKey;
                    const count = byDate[dateKey]?.length ?? 0;

                    return (
                      <button
                        key={dateKey}
                        type="button"
                        onClick={() => setSelectedDateKey(dateKey)}
                        className={`${cellMin} rounded-xl border p-3 text-left transition hover:border-brand-300 hover:shadow-soft ${
                          isToday
                            ? "border-brand-500 bg-white ring-1 ring-brand-300"
                            : tall
                              ? "border-brand-100 bg-white/90"
                              : "border-ink-100 bg-white"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className={`text-sm font-semibold ${
                              isToday ? "text-brand-700" : "text-ink-900"
                            }`}
                          >
                            {date.getDate()}
                          </span>
                          {count > 0 && (
                            <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] text-ink-500">
                              {count}
                            </span>
                          )}
                        </div>
                        <DayTotalsDisplay totals={totals} compact />
                      </button>
                    );
                  })}

                  <div
                    className={`${cellMin} rounded-xl border-2 p-3 ${
                      tall
                        ? "border-brand-300 bg-white/80"
                        : "border-ink-200 bg-ink-50"
                    }`}
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                      Total
                    </p>
                    {hasAnyTotals(week.weekTotals) ? (
                      <DayTotalsDisplay totals={week.weekTotals} compact />
                    ) : (
                      <p className="text-xs text-ink-200">—</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDateKey && (
        <DayDetailPanel
          dateKey={selectedDateKey}
          activities={byDate[selectedDateKey] ?? []}
          onClose={() => setSelectedDateKey(null)}
        />
      )}
    </>
  );
}

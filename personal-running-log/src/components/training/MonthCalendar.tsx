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
import { formatMiles } from "lib/training/format";
import DayTotalsDisplay from "./DayTotalsDisplay";
import DayDetailPanel from "./DayDetailPanel";

export type CalendarWeek = {
  weekStartKey: string;
  weekDays: string[];
  weekTotals: DayTotals;
  /** First week in the 4-week view — shown taller */
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

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-soft">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
            Completed miles
          </p>
          <p className="text-xl font-semibold text-brand-700">
            {periodTotals.runMiles > 0
              ? formatMiles(periodTotals.runMiles)
              : "0.0 mi"}
          </p>
        </div>
        <div className="h-8 w-px bg-ink-100" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
            Planned miles
          </p>
          <p className="text-xl font-semibold text-brand-400">
            {periodTotals.plannedRunMiles > 0
              ? formatMiles(periodTotals.plannedRunMiles)
              : "0.0 mi"}
          </p>
        </div>
        <div className="h-8 w-px bg-ink-100" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
            Combined
          </p>
          <p className="text-xl font-semibold text-ink-900">
            {formatMiles(periodTotals.runMiles + periodTotals.plannedRunMiles)}
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
            const cellMin = tall ? "min-h-[240px]" : "min-h-[120px]";

            return (
              <div key={week.weekStartKey}>
                <p className="mb-1.5 text-xs font-medium text-ink-500">
                  {formatWeekLabel(parseDateKey(week.weekStartKey))}
                  {tall && (
                    <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                      Focus week
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
                            ? "border-brand-500 bg-brand-50 ring-1 ring-brand-200"
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
                    className={`${cellMin} rounded-xl border-2 border-ink-200 bg-ink-50 p-3`}
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

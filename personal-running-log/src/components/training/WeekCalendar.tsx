"use client";

import type { ActivityWithDetails } from "app/actions/activities";
import { useState } from "react";
import {
  groupActivitiesByDate,
  totalsForActivities,
  type DayTotals,
} from "lib/training/totals";
import { WEEKDAY_LABELS } from "lib/training/dates";
import DayTotalsDisplay from "./DayTotalsDisplay";
import DayDetailPanel from "./DayDetailPanel";
import CoachDayPanel from "components/coach/CoachDayPanel";

type WeekCalendarProps = {
  weekDays: string[];
  activities: ActivityWithDetails[];
  weekTotals: DayTotals;
  todayKey: string;
  /** When set, day clicks open coach prescribe panel for this athlete. */
  coachAthleteId?: string;
};

export default function WeekCalendar({
  weekDays,
  activities,
  weekTotals,
  todayKey,
  coachAthleteId,
}: WeekCalendarProps) {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const byDate = groupActivitiesByDate(activities);
  const dayTotalsList = weekDays.map((key) =>
    totalsForActivities(byDate[key] ?? [])
  );

  return (
    <>
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-8 gap-2">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-500"
              >
                {label}
              </div>
            ))}
            <div className="px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              Week
            </div>

            {weekDays.map((dateKey, index) => {
              const date = new Date(dateKey + "T12:00:00");
              const totals = dayTotalsList[index];
              const isToday = dateKey === todayKey;
              const dayActs = byDate[dateKey] ?? [];
              const hasCoachPlan = dayActs.some((a) => a.prescribedById);

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(dateKey)}
                  className={`min-h-[120px] rounded-xl border p-3 text-left transition hover:border-brand-300 hover:shadow-soft ${
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
                    <div className="flex items-center gap-1">
                      {hasCoachPlan && (
                        <span className="rounded bg-brand-100 px-1 py-0.5 text-[9px] font-bold uppercase text-brand-700">
                          C
                        </span>
                      )}
                      {dayActs.length > 0 && (
                        <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] text-ink-500">
                          {dayActs.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <DayTotalsDisplay totals={totals} compact />
                </button>
              );
            })}

            <div className="min-h-[120px] rounded-xl border-2 border-ink-200 bg-ink-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                Total
              </p>
              <DayTotalsDisplay totals={weekTotals} compact />
            </div>
          </div>
        </div>
      </div>

      {selectedDateKey &&
        (coachAthleteId ? (
          <CoachDayPanel
            dateKey={selectedDateKey}
            athleteId={coachAthleteId}
            activities={byDate[selectedDateKey] ?? []}
            onClose={() => setSelectedDateKey(null)}
          />
        ) : (
          <DayDetailPanel
            dateKey={selectedDateKey}
            activities={byDate[selectedDateKey] ?? []}
            onClose={() => setSelectedDateKey(null)}
          />
        ))}
    </>
  );
}

"use client";

import type { ActivityWithDetails } from "app/actions/activities";
import { useState } from "react";
import {
  groupActivitiesByDate,
  totalsForActivities,
  type DayTotals,
} from "lib/training/totals";
import { WEEKDAY_LABELS } from "lib/training/dates";
import { formatDistance, formatDuration } from "lib/training/format";
import { usePreferences } from "lib/preferences";
import type { DistanceUnit } from "lib/training/format";
import DayTotalsDisplay from "./DayTotalsDisplay";
import DayDetailPanel from "./DayDetailPanel";
import CoachDayPanel from "components/coach/CoachDayPanel";

type WeekCalendarProps = {
  weekDays: string[];
  activities: ActivityWithDetails[];
  weekTotals: DayTotals;
  todayKey: string;
  coachAthleteId?: string;
};

function summaryLine(totals: DayTotals, unit: DistanceUnit): string {
  const bits: string[] = [];
  if (totals.runMiles > 0) bits.push(formatDistance(totals.runMiles, unit));
  if (totals.plannedRunMiles > 0) {
    bits.push(`Plan ${formatDistance(totals.plannedRunMiles, unit)}`);
  }
  if (totals.bikeSeconds > 0) {
    bits.push(`Bike ${formatDuration(totals.bikeSeconds)}`);
  }
  if (totals.xtrainSeconds > 0) {
    bits.push(`XT ${formatDuration(totals.xtrainSeconds)}`);
  }
  return bits.length > 0 ? bits.join(" · ") : "—";
}

export default function WeekCalendar({
  weekDays,
  activities,
  weekTotals,
  todayKey,
  coachAthleteId,
}: WeekCalendarProps) {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const { unit } = usePreferences();
  const byDate = groupActivitiesByDate(activities);
  const dayTotalsList = weekDays.map((key) =>
    totalsForActivities(byDate[key] ?? [])
  );

  return (
    <>
      {/* Mobile list */}
      <div className="overflow-hidden rounded-xl border border-ink-100 bg-white md:hidden">
        <ul className="divide-y divide-ink-100">
          {weekDays.map((dateKey, index) => {
            const date = new Date(dateKey + "T12:00:00");
            const totals = dayTotalsList[index];
            const isToday = dateKey === todayKey;
            const dayActs = byDate[dateKey] ?? [];
            const hasCoachPlan = dayActs.some((a) => a.prescribedById);

            return (
              <li key={dateKey}>
                <button
                  type="button"
                  onClick={() => setSelectedDateKey(dateKey)}
                  className={`flex min-h-[52px] w-full items-center gap-3 px-3 py-2.5 text-left ${
                    isToday ? "bg-brand-50" : ""
                  }`}
                >
                  <div className="w-10 shrink-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                      {WEEKDAY_LABELS[index]}
                    </p>
                    <p
                      className={`text-base font-semibold leading-tight ${
                        isToday ? "text-brand-700" : "text-ink-900"
                      }`}
                    >
                      {date.getDate()}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink-700">
                      {summaryLine(totals, unit)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {hasCoachPlan && (
                      <span className="rounded bg-brand-100 px-1 py-0.5 text-[9px] font-bold uppercase text-brand-700">
                        C
                      </span>
                    )}
                    {dayActs.length > 0 && (
                      <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] text-ink-500">
                        {dayActs.length}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between border-t border-ink-100 bg-ink-50 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
            Week total
          </p>
          <DayTotalsDisplay totals={weekTotals} compact />
        </div>
      </div>

      {/* Desktop grid */}
      <div className="hidden md:block">
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

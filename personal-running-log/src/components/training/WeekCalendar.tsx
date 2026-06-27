"use client";

import type { Activity } from "@prisma/client";
import { useState } from "react";
import { toDateKey } from "lib/training/dates";
import {
  groupActivitiesByDate,
  sumTotals,
  totalsForActivities,
  type DayTotals,
} from "lib/training/totals";
import { WEEKDAY_LABELS } from "lib/training/dates";
import DayTotalsDisplay from "./DayTotalsDisplay";
import DayDetailPanel from "./DayDetailPanel";

type WeekCalendarProps = {
  weekDays: string[];
  activities: Activity[];
  weekTotals: DayTotals;
  todayKey: string;
};

export default function WeekCalendar({
  weekDays,
  activities,
  weekTotals,
  todayKey,
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
                className="px-2 py-1 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                {label}
              </div>
            ))}
            <div className="px-2 py-1 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
              Week
            </div>

            {weekDays.map((dateKey, index) => {
              const date = new Date(dateKey + "T12:00:00");
              const totals = dayTotalsList[index];
              const isToday = dateKey === todayKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(dateKey)}
                  className={`min-h-[120px] rounded-lg border p-3 text-left transition hover:border-blue-400 hover:shadow-sm ${
                    isToday
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={`text-sm font-semibold ${
                        isToday ? "text-blue-700" : "text-gray-900"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {(byDate[dateKey]?.length ?? 0) > 0 && (
                      <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                        {byDate[dateKey].length}
                      </span>
                    )}
                  </div>
                  <DayTotalsDisplay totals={totals} compact />
                </button>
              );
            })}

            <div className="min-h-[120px] rounded-lg border-2 border-gray-300 bg-gray-50 p-3">
              <p className="mb-2 text-sm font-semibold text-gray-700">Total</p>
              <DayTotalsDisplay totals={weekTotals} compact />
            </div>
          </div>
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

export function buildWeekCalendarData(
  weekDayDates: Date[],
  activities: Activity[],
  today: Date
) {
  const weekDays = weekDayDates.map(toDateKey);
  const dayTotalsList = weekDays.map((key) =>
    totalsForActivities(groupActivitiesByDate(activities)[key] ?? [])
  );
  const weekTotals = sumTotals(dayTotalsList);
  const todayKey = toDateKey(today);

  return { weekDays, weekTotals, todayKey };
}

"use client";

import Link from "next/link";
import type { Activity } from "@prisma/client";
import WeekCalendar, { buildWeekCalendarData } from "components/training/WeekCalendar";
import DayTotalsDisplay from "components/training/DayTotalsDisplay";
import {
  addWeeks,
  formatWeekLabel,
  getWeekDays,
  parseDateKey,
  toDateKey,
  getMonday,
} from "lib/training/dates";
import { formatDurationLong, formatMiles } from "lib/training/format";

type TrainingLogViewProps = {
  weekStartKey: string;
  weekDayDates: string[];
  activities: Activity[];
};

export default function TrainingLogView({
  weekStartKey,
  weekDayDates,
  activities,
}: TrainingLogViewProps) {
  const weekStart = parseDateKey(weekStartKey);
  const prevWeekKey = toDateKey(addWeeks(weekStart, -1));
  const nextWeekKey = toDateKey(addWeeks(weekStart, 1));
  const currentWeekKey = toDateKey(getMonday(new Date()));

  const dates = weekDayDates.map((k) => parseDateKey(k));
  const { weekDays, weekTotals, todayKey } = buildWeekCalendarData(
    dates,
    activities,
    new Date()
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Log</h1>
          <p className="text-sm text-gray-600">{formatWeekLabel(weekStart)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/training-log?week=${prevWeekKey}`}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            ← Prev
          </Link>
          {weekStartKey !== currentWeekKey && (
            <Link
              href={`/training-log?week=${currentWeekKey}`}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              This week
            </Link>
          )}
          <Link
            href={`/training-log?week=${nextWeekKey}`}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Next →
          </Link>
        </div>
      </div>

      <p className="mb-4 text-sm text-gray-500">
        Click a day to view or add activities. Week totals appear in the right column.
      </p>

      <WeekCalendar
        weekDays={weekDays}
        activities={activities}
        weekTotals={weekTotals}
        todayKey={todayKey}
      />
    </div>
  );
}

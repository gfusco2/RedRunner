"use client";

import Link from "next/link";
import type { Activity } from "@prisma/client";
import MonthCalendar, {
  type CalendarWeek,
} from "components/training/MonthCalendar";
import {
  addWeeks,
  formatRangeLabel,
  getFourWeekStarts,
  getWeekDays,
  parseDateKey,
  toDateKey,
  getMonday,
  getMultiWeekRange,
} from "lib/training/dates";
import {
  buildWeekCalendarData,
  sumTotals,
  totalsForActivities,
  groupActivitiesByDate,
} from "lib/training/totals";

type TrainingLogViewProps = {
  weekStartKey: string;
  activities: Activity[];
};

export default function TrainingLogView({
  weekStartKey,
  activities,
}: TrainingLogViewProps) {
  const weekStart = parseDateKey(weekStartKey);
  const prevWeekKey = toDateKey(addWeeks(weekStart, -1));
  const nextWeekKey = toDateKey(addWeeks(weekStart, 1));
  const currentWeekKey = toDateKey(getMonday(new Date()));
  const todayKey = toDateKey(new Date());

  const weekStarts = getFourWeekStarts(weekStart);
  const { end } = getMultiWeekRange(weekStart, 4);

  const weeks: CalendarWeek[] = weekStarts.map((ws, index) => {
    const days = getWeekDays(ws);
    const { weekDays, weekTotals } = buildWeekCalendarData(
      days,
      activities,
      new Date()
    );
    return {
      weekStartKey: toDateKey(ws),
      weekDays,
      weekTotals,
      emphasized: index === 0,
    };
  });

  const byDate = groupActivitiesByDate(activities);
  const allDayKeys = weeks.flatMap((w) => w.weekDays);
  const periodTotals = sumTotals(
    allDayKeys.map((key) => totalsForActivities(byDate[key] ?? []))
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Training Log
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {formatRangeLabel(weekStart, end)} · 4 weeks · focus week enlarged
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/training-log?week=${prevWeekKey}`} className="btn-ghost">
            ← Prev
          </Link>
          {weekStartKey !== currentWeekKey && (
            <Link
              href={`/training-log?week=${currentWeekKey}`}
              className="btn-ghost"
            >
              This week
            </Link>
          )}
          <Link href={`/training-log?week=${nextWeekKey}`} className="btn-ghost">
            Next →
          </Link>
        </div>
      </div>

      <p className="mb-5 text-sm text-ink-500">
        Click a day to log or plan. Planned miles show in lighter red; completed
        miles in solid red.
      </p>

      <MonthCalendar
        weeks={weeks}
        activities={activities}
        todayKey={todayKey}
        periodTotals={periodTotals}
      />
    </div>
  );
}

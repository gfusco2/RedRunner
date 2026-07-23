"use client";

import Link from "next/link";
import type { ActivityWithDetails } from "app/actions/activities";
import type { WeekPlan } from "@prisma/client";
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
  getPastFourWeekRange,
} from "lib/training/dates";
import { goalBand } from "lib/training/goals";
import {
  buildWeekCalendarData,
  sumTotals,
  totalsForActivities,
  groupActivitiesByDate,
} from "lib/training/totals";

type TrainingLogViewProps = {
  weekStartKey: string;
  activities: ActivityWithDetails[];
  plansByWeek: Record<string, WeekPlan>;
};

export default function TrainingLogView({
  weekStartKey,
  activities,
  plansByWeek,
}: TrainingLogViewProps) {
  const weekStart = parseDateKey(weekStartKey);
  const prevWeekKey = toDateKey(addWeeks(weekStart, -1));
  const nextWeekKey = toDateKey(addWeeks(weekStart, 1));
  const currentWeekKey = toDateKey(getMonday(new Date()));
  const todayKey = toDateKey(new Date());

  const weekStarts = getFourWeekStarts(weekStart);
  const { start: rangeStart, end: rangeEnd } = getPastFourWeekRange(weekStart);

  const weeks: CalendarWeek[] = weekStarts.map((ws) => {
    const days = getWeekDays(ws);
    const weekKey = toDateKey(ws);
    const { weekDays, weekTotals } = buildWeekCalendarData(
      days,
      activities,
      new Date()
    );
    const plan = plansByWeek[weekKey];
    return {
      weekStartKey: weekKey,
      weekDays,
      weekTotals,
      emphasized: weekKey === currentWeekKey,
      goal: goalBand(plan?.goalRunMiles, plan?.goalRangeMiles),
    };
  });

  const byDate = groupActivitiesByDate(activities);
  const allDayKeys = weeks.flatMap((w) => w.weekDays);
  const periodTotals = sumTotals(
    allDayKeys.map((key) => totalsForActivities(byDate[key] ?? []))
  );

  const focusGoal =
    weeks.find((w) => w.emphasized)?.goal ??
    goalBand(
      plansByWeek[currentWeekKey]?.goalRunMiles,
      plansByWeek[currentWeekKey]?.goalRangeMiles
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Training Log
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {formatRangeLabel(rangeStart, rangeEnd)} · current week highlighted
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
        Click a day to log or plan. Goal is the weekly target; planned miles are
        what you’ve written on the calendar.
      </p>

      <MonthCalendar
        weeks={weeks}
        activities={activities}
        todayKey={todayKey}
        periodTotals={periodTotals}
        focusGoal={focusGoal}
      />
    </div>
  );
}

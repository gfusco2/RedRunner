"use client";

import Link from "next/link";
import type { ActivityWithDetails } from "app/actions/activities";
import type { WeekPlan } from "@prisma/client";
import MonthCalendar, {
  type CalendarWeek,
} from "components/training/MonthCalendar";
import WeekGoalEditor from "components/dashboard/WeekGoalEditor";
import {
  addWeeks,
  formatRangeLabel,
  formatWeekLabel,
  getFourWeekStarts,
  getWeekDays,
  parseDateKey,
  toDateKey,
  getMonday,
  getPastFourWeekRange,
  localTodayKey,
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
  canEditGoals?: boolean;
};

export default function TrainingLogView({
  weekStartKey,
  activities,
  plansByWeek,
  canEditGoals = false,
}: TrainingLogViewProps) {
  const weekStart = parseDateKey(weekStartKey);
  const prevWeekKey = toDateKey(addWeeks(weekStart, -1));
  const nextWeekKey = toDateKey(addWeeks(weekStart, 1));
  const currentWeekKey = toDateKey(getMonday(parseDateKey(localTodayKey())));
  const todayKey = localTodayKey();

  const weekStarts = getFourWeekStarts(weekStart);
  const { start: rangeStart, end: rangeEnd } = getPastFourWeekRange(weekStart);

  const weeks: CalendarWeek[] = weekStarts.map((ws) => {
    const days = getWeekDays(ws);
    const weekKey = toDateKey(ws);
    const { weekDays, weekTotals } = buildWeekCalendarData(
      days,
      activities,
      parseDateKey(todayKey)
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

  // Summary goal follows the week you're browsing (top of stack / URL week)
  const focusPlan = plansByWeek[weekStartKey] ?? null;
  const focusGoal = goalBand(
    focusPlan?.goalRunMiles,
    focusPlan?.goalRangeMiles
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
            Training Log
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {formatRangeLabel(rangeStart, rangeEnd)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/training-log?week=${prevWeekKey}`}
            className="btn-ghost min-h-[40px] flex-1 px-3 text-center sm:flex-none"
          >
            ← Prev
          </Link>
          {weekStartKey !== currentWeekKey && (
            <Link
              href={`/training-log?week=${currentWeekKey}`}
              className="btn-ghost min-h-[40px] flex-1 px-3 text-center sm:flex-none"
            >
              Today
            </Link>
          )}
          <Link
            href={`/training-log?week=${nextWeekKey}`}
            className="btn-ghost min-h-[40px] flex-1 px-3 text-center sm:flex-none"
          >
            Next →
          </Link>
        </div>
      </div>

      <p className="mb-4 hidden text-sm text-ink-500 sm:block">
        Click a day to log or plan. Set a weekly goal on any week — including
        far ahead — then fill workouts when ready.
      </p>

      {canEditGoals && (
        <div className="mb-4 rounded-xl border border-ink-100 bg-white p-3 shadow-soft sm:mb-5 sm:p-4">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink-900">
              Goal for {formatWeekLabel(weekStart)}
            </h2>
            {weekStartKey !== currentWeekKey && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-600">
                Ahead
              </span>
            )}
          </div>
          <WeekGoalEditor
            weekStartKey={weekStartKey}
            initial={focusPlan}
            compact
          />
        </div>
      )}

      <MonthCalendar
        weeks={weeks}
        activities={activities}
        todayKey={todayKey}
        periodTotals={periodTotals}
        focusGoal={focusGoal}
        plansByWeek={plansByWeek}
        canEditGoals={canEditGoals}
      />
    </div>
  );
}

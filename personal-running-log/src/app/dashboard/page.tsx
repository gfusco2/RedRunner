import Link from "next/link";
import { getActivitiesInRange } from "app/actions/activities";
import { getCurrentProfile } from "app/actions/auth";
import {
  getWeekPlan,
  getWeekPlansInRange,
} from "app/actions/weekPlans";
import { getWellnessForRange } from "app/actions/wellness";
import DashboardSummaryCards from "components/dashboard/DashboardSummaryCards";
import RollingMileageChart from "components/dashboard/RollingMileageChart";
import {
  MilesByTagCard,
  WeekCompareCards,
} from "components/dashboard/WeekCompareCards";
import WeekPlanForm from "components/dashboard/WeekPlanForm";
import DayTotalsDisplay from "components/training/DayTotalsDisplay";
import WeekCalendar from "components/training/WeekCalendar";
import {
  addWeeks,
  formatWeekLabel,
  getMonday,
  getWeekDays,
  getWeekRange,
  toDateKey,
} from "lib/training/dates";
import {
  buildRolling7DaySeries,
  milesByTag,
} from "lib/training/analytics";
import { goalBand } from "lib/training/goals";
import {
  chartBandsFromPlans,
  plansByWeekKey,
  weekKeysForward,
} from "lib/training/weekPlans";
import {
  buildWeekCalendarData,
  groupActivitiesByDate,
  totalsForActivities,
} from "lib/training/totals";

export default async function DashboardPage() {
  const today = new Date();
  const weekStart = getMonday(today);
  const lastWeekStart = addWeeks(weekStart, -1);
  const weekDays = getWeekDays(weekStart);
  const weekStartKey = toDateKey(weekStart);

  const historyStart = addWeeks(weekStart, -11);
  const historyStartKey = toDateKey(historyStart);
  const { end: historyEnd } = getWeekRange(weekStart);
  const historyEndKey = toDateKey(historyEnd);

  const blockKeys = weekKeysForward(weekStartKey, 4);
  const blockEndKey = blockKeys[blockKeys.length - 1];

  const rollingStartKey = toDateKey(addWeeks(weekStart, -8));

  const [
    profile,
    historyActivities,
    weekPlan,
    blockPlans,
    chartPlans,
    wellness,
  ] = await Promise.all([
    getCurrentProfile(),
    getActivitiesInRange(historyStartKey, historyEndKey),
    getWeekPlan(weekStartKey),
    getWeekPlansInRange(weekStartKey, blockEndKey),
    getWeekPlansInRange(rollingStartKey, weekStartKey),
    getWellnessForRange(weekStartKey, historyEndKey),
  ]);

  const thisWeekActivities = historyActivities.filter((a) => {
    const t = new Date(a.date).getTime();
    return t >= weekStart.getTime() && t < historyEnd.getTime();
  });
  const lastWeekEnd = weekStart;
  const lastWeekActivities = historyActivities.filter((a) => {
    const t = new Date(a.date).getTime();
    return t >= lastWeekStart.getTime() && t < lastWeekEnd.getTime();
  });

  const { weekTotals, todayKey } = buildWeekCalendarData(
    weekDays,
    thisWeekActivities,
    today
  );
  const lastWeekTotals = totalsForActivities(lastWeekActivities);
  const byDate = groupActivitiesByDate(thisWeekActivities);
  const weekDayKeys = weekDays.map(toDateKey);

  const rolling = buildRolling7DaySeries(
    historyActivities,
    rollingStartKey,
    toDateKey(today)
  );
  const goalBands = chartBandsFromPlans(
    chartPlans,
    rollingStartKey,
    toDateKey(today)
  );
  const tagMiles = milesByTag(thisWeekActivities);
  const thisGoal = goalBand(weekPlan?.goalRunMiles, weekPlan?.goalRangeMiles);

  const wellnessDone = wellness.filter(
    (w) => w.strengthDone || w.stretchDone
  ).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {!profile && (
        <div className="mb-6 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-ink-700">
          <Link href="/login" className="font-medium text-brand-600 underline">
            Sign in
          </Link>{" "}
          to see your personal training summary.
        </div>
      )}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Current week · {formatWeekLabel(weekStart)}
            {wellnessDone > 0
              ? ` · ${wellnessDone} wellness day${wellnessDone === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/reports" className="btn-ghost">
            Reports
          </Link>
          <Link
            href={`/training-log?week=${weekStartKey}`}
            className="btn-primary"
          >
            Open Training Log
          </Link>
        </div>
      </div>

      <DashboardSummaryCards totals={weekTotals} goal={thisGoal} />

      <div className="mb-8">
        <RollingMileageChart points={rolling} goalBands={goalBands} />
      </div>

      <div className="mb-8">
        <WeekCompareCards
          thisWeek={weekTotals}
          lastWeek={lastWeekTotals}
          goal={thisGoal}
        />
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <MilesByTagCard rows={tagMiles} />
        {profile ? (
          <WeekPlanForm
            baseWeekStartKey={weekStartKey}
            plansByWeek={plansByWeekKey(blockPlans)}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50 p-4 text-sm text-ink-500">
            Sign in to set weekly mileage goals.
          </div>
        )}
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-ink-900">
          This week at a glance
        </h2>
        <WeekCalendar
          weekDays={weekDayKeys}
          activities={thisWeekActivities}
          weekTotals={weekTotals}
          todayKey={todayKey}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink-900">
          Daily breakdown
        </h2>
        <div className="divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-100 bg-white shadow-soft">
          {weekDayKeys.map((dateKey) => {
            const date = new Date(dateKey + "T12:00:00");
            const dayActivities = byDate[dateKey] ?? [];
            const totals = totalsForActivities(dayActivities);
            const isToday = dateKey === todayKey;
            const dayWell = wellness.find(
              (w) => toDateKey(new Date(w.date)) === dateKey
            );

            return (
              <div
                key={dateKey}
                className={`flex items-center justify-between px-4 py-3 ${
                  isToday ? "bg-brand-50" : ""
                }`}
              >
                <div>
                  <p className="font-medium text-ink-900">
                    {date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                    {isToday && (
                      <span className="ml-2 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Today
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-500">
                    {dayActivities.length} activit
                    {dayActivities.length === 1 ? "y" : "ies"}
                    {dayWell?.strengthDone ? " · Strength" : ""}
                    {dayWell?.stretchDone ? " · Stretch" : ""}
                  </p>
                </div>
                <DayTotalsDisplay totals={totals} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

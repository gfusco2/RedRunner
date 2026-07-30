import Link from "next/link";
import { notFound } from "next/navigation";
import { getAthleteActivitiesInRange } from "app/actions/activities";
import { getCurrentProfile } from "lib/auth/profile";

export const maxDuration = 10;
import { listMyAthletes } from "app/actions/coaching";
import {
  getWeekPlan,
  getWeekPlansInRange,
} from "app/actions/weekPlans";
import WeekPlanForm from "components/dashboard/WeekPlanForm";
import DayTotalsDisplay from "components/training/DayTotalsDisplay";
import WeekCalendar from "components/training/WeekCalendar";
import {
  addWeeks,
  formatWeekLabel,
  getMonday,
  getWeekDays,
  getWeekRange,
  parseDateKey,
  toDateKey,
} from "lib/training/dates";
import { goalBand } from "lib/training/goals";
import {
  plansByWeekKey,
  weekKeysForward,
} from "lib/training/weekPlans";
import {
  buildWeekCalendarData,
  groupActivitiesByDate,
  totalsForActivities,
} from "lib/training/totals";
import prisma from "lib/prisma";

type PageProps = {
  params: Promise<{ athleteId: string }>;
  searchParams: Promise<{ week?: string }>;
};

export default async function CoachAthletePage({
  params,
  searchParams,
}: PageProps) {
  const { athleteId } = await params;
  const { week } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 text-sm">
        <Link href="/login" className="text-brand-600 underline">
          Sign in
        </Link>{" "}
        to coach athletes.
      </div>
    );
  }

  const athletes = await listMyAthletes();
  const athlete = athletes.find((a) => a.id === athleteId);
  if (!athlete) {
    const exists = await prisma.user.findUnique({ where: { id: athleteId } });
    if (!exists) notFound();
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-ink-700">
          You are not linked to this athlete.{" "}
          <Link href="/settings" className="text-brand-600 underline">
            Link them in Settings
          </Link>
          .
        </p>
      </div>
    );
  }

  const today = new Date();
  const currentWeekKey = toDateKey(getMonday(today));
  const weekStart = week ? parseDateKey(week) : getMonday(today);
  const weekStartKey = toDateKey(getMonday(weekStart));
  const weekDays = getWeekDays(parseDateKey(weekStartKey));
  const { end } = getWeekRange(parseDateKey(weekStartKey));
  const endKey = toDateKey(end);

  const prevWeekKey = toDateKey(addWeeks(parseDateKey(weekStartKey), -1));
  const nextWeekKey = toDateKey(addWeeks(parseDateKey(weekStartKey), 1));

  const blockKeys = weekKeysForward(weekStartKey, 4);
  const blockEndKey = blockKeys[blockKeys.length - 1];

  const [activities, weekPlan, blockPlans] = await Promise.all([
    getAthleteActivitiesInRange(athleteId, weekStartKey, endKey),
    getWeekPlan(weekStartKey, athleteId),
    getWeekPlansInRange(weekStartKey, blockEndKey, athleteId),
  ]);

  const { weekTotals, todayKey } = buildWeekCalendarData(
    weekDays,
    activities,
    today
  );
  const byDate = groupActivitiesByDate(activities);
  const weekDayKeys = weekDays.map(toDateKey);
  const goal = goalBand(weekPlan?.goalRunMiles, weekPlan?.goalRangeMiles);
  const basePath = `/coach/${athleteId}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            Coach view
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            {athlete.name?.trim() || athlete.email}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {formatWeekLabel(parseDateKey(weekStartKey))} · click a day to
            prescribe
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`${basePath}?week=${prevWeekKey}`} className="btn-ghost">
            ← Prev week
          </Link>
          {weekStartKey !== currentWeekKey && (
            <Link href={basePath} className="btn-ghost">
              This week
            </Link>
          )}
          <Link href={`${basePath}?week=${nextWeekKey}`} className="btn-ghost">
            Next week →
          </Link>
          <Link href="/settings" className="btn-ghost">
            Manage athletes
          </Link>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800">
        <span>
          Actual <strong>{weekTotals.runMiles.toFixed(1)} mi</strong>
        </span>
        {goal ? (
          <span>
            {" "}
            · Goal <strong>{goal.goal.toFixed(0)} mi</strong>
            <span className="text-brand-700">
              {" "}
              ({goal.low.toFixed(0)}–{goal.high.toFixed(0)})
            </span>
          </span>
        ) : (
          <span> · no weekly goal set yet</span>
        )}
        {weekTotals.plannedRunMiles > 0 && (
          <span className="text-brand-600 opacity-75">
            {" "}
            · Planned {weekTotals.plannedRunMiles.toFixed(1)} mi
          </span>
        )}
      </div>

      <div className="mb-8">
        <WeekPlanForm
          baseWeekStartKey={weekStartKey}
          plansByWeek={plansByWeekKey(blockPlans)}
          athleteId={athleteId}
        />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-ink-900">
          Week days
        </h2>
        <p className="mb-3 text-sm text-ink-500">
          Use Prev / Next to move week by week. Days with a coach prescription
          show a red <strong>C</strong>. Click any day to add WU / main / CD.
        </p>
        <WeekCalendar
          weekDays={weekDayKeys}
          activities={activities}
          weekTotals={weekTotals}
          todayKey={todayKey}
          coachAthleteId={athleteId}
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
            return (
              <div
                key={dateKey}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink-900">
                    {date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-ink-500">
                    {dayActivities.length} activit
                    {dayActivities.length === 1 ? "y" : "ies"}
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

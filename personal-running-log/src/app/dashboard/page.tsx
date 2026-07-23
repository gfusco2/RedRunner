import Link from "next/link";
import { getCurrentWeekActivities } from "app/actions/activities";
import DayTotalsDisplay from "components/training/DayTotalsDisplay";
import WeekCalendar from "components/training/WeekCalendar";
import {
  formatWeekLabel,
  getMonday,
  getWeekDays,
  toDateKey,
} from "lib/training/dates";
import { formatDurationLong, formatMiles } from "lib/training/format";
import {
  buildWeekCalendarData,
  groupActivitiesByDate,
  totalsForActivities,
} from "lib/training/totals";

export default async function DashboardPage() {
  const today = new Date();
  const weekStart = getMonday(today);
  const weekDays = getWeekDays(weekStart);
  const weekStartKey = toDateKey(weekStart);
  const activities = await getCurrentWeekActivities();

  const { weekTotals, todayKey } = buildWeekCalendarData(
    weekDays,
    activities,
    today
  );

  const byDate = groupActivitiesByDate(activities);
  const weekDayKeys = weekDays.map(toDateKey);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Current week · {formatWeekLabel(weekStart)}
          </p>
        </div>
        <Link
          href={`/training-log?week=${weekStartKey}`}
          className="btn-primary"
        >
          Open Training Log
        </Link>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Completed miles
          </p>
          <p className="mt-1 text-2xl font-semibold text-brand-800">
            {weekTotals.runMiles > 0
              ? formatMiles(weekTotals.runMiles)
              : "0.0 mi"}
          </p>
        </div>
        <div className="rounded-xl border border-brand-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">
            Planned miles
          </p>
          <p className="mt-1 text-2xl font-semibold text-brand-500">
            {weekTotals.plannedRunMiles > 0
              ? formatMiles(weekTotals.plannedRunMiles)
              : "0.0 mi"}
          </p>
        </div>
        <div className="rounded-xl border border-ink-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Bike time
          </p>
          <p className="mt-1 text-2xl font-semibold text-ink-900">
            {formatDurationLong(weekTotals.bikeSeconds)}
          </p>
        </div>
        <div className="rounded-xl border border-ink-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            X-Train time
          </p>
          <p className="mt-1 text-2xl font-semibold text-ink-900">
            {formatDurationLong(weekTotals.xtrainSeconds)}
          </p>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-ink-900">
          This week at a glance
        </h2>
        <WeekCalendar
          weekDays={weekDayKeys}
          activities={activities}
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

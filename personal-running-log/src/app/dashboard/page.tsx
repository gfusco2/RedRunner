import Link from "next/link";
import { getCurrentWeekActivities } from "app/actions/activities";
import DayTotalsDisplay from "components/training/DayTotalsDisplay";
import WeekCalendar, { buildWeekCalendarData } from "components/training/WeekCalendar";
import {
  formatWeekLabel,
  getMonday,
  getWeekDays,
  toDateKey,
} from "lib/training/dates";
import { formatDurationLong, formatMiles } from "lib/training/format";
import { groupActivitiesByDate, totalsForActivities } from "lib/training/totals";

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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">Current week · {formatWeekLabel(weekStart)}</p>
        </div>
        <Link
          href={`/training-log?week=${weekStartKey}`}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Open Training Log
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-800">Run mileage</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">
            {weekTotals.runMiles > 0
              ? formatMiles(weekTotals.runMiles)
              : "0.0 mi"}
          </p>
        </div>
        <div className="rounded-lg border border-green-100 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">Bike time</p>
          <p className="mt-1 text-2xl font-bold text-green-900">
            {formatDurationLong(weekTotals.bikeSeconds)}
          </p>
        </div>
        <div className="rounded-lg border border-purple-100 bg-purple-50 p-4">
          <p className="text-sm font-medium text-purple-800">X-Train time</p>
          <p className="mt-1 text-2xl font-bold text-purple-900">
            {formatDurationLong(weekTotals.xtrainSeconds)}
          </p>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">This week at a glance</h2>
        <WeekCalendar
          weekDays={weekDayKeys}
          activities={activities}
          weekTotals={weekTotals}
          todayKey={todayKey}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Daily breakdown</h2>
        <div className="divide-y rounded-lg border bg-white">
          {weekDayKeys.map((dateKey) => {
            const date = new Date(dateKey + "T12:00:00");
            const dayActivities = byDate[dateKey] ?? [];
            const totals = totalsForActivities(dayActivities);
            const isToday = dateKey === todayKey;

            return (
              <div
                key={dateKey}
                className={`flex items-center justify-between px-4 py-3 ${
                  isToday ? "bg-blue-50" : ""
                }`}
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                    {isToday && (
                      <span className="ml-2 rounded bg-blue-600 px-1.5 py-0.5 text-xs text-white">
                        Today
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
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

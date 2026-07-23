import type { Activity, ActivityType } from "@prisma/client";
import { toDateKey } from "./dates";

export type DayTotals = {
  /** Completed run mileage */
  runMiles: number;
  /** Planned (not yet done) run mileage */
  plannedRunMiles: number;
  bikeSeconds: number;
  plannedBikeSeconds: number;
  xtrainSeconds: number;
  plannedXtrainSeconds: number;
};

export const emptyDayTotals = (): DayTotals => ({
  runMiles: 0,
  plannedRunMiles: 0,
  bikeSeconds: 0,
  plannedBikeSeconds: 0,
  xtrainSeconds: 0,
  plannedXtrainSeconds: 0,
});

export function addToTotals(totals: DayTotals, activity: Activity): DayTotals {
  const next = { ...totals };
  const planned = activity.planned;

  if (activity.type === "RUN" && activity.distance_miles) {
    if (planned) next.plannedRunMiles += activity.distance_miles;
    else next.runMiles += activity.distance_miles;
  }
  if (activity.type === "BIKE" && activity.duration_seconds) {
    if (planned) next.plannedBikeSeconds += activity.duration_seconds;
    else next.bikeSeconds += activity.duration_seconds;
  }
  if (activity.type === "XTRAIN" && activity.duration_seconds) {
    if (planned) next.plannedXtrainSeconds += activity.duration_seconds;
    else next.xtrainSeconds += activity.duration_seconds;
  }
  return next;
}

export function sumTotals(days: DayTotals[]): DayTotals {
  return days.reduce(
    (acc, day) => ({
      runMiles: acc.runMiles + day.runMiles,
      plannedRunMiles: acc.plannedRunMiles + day.plannedRunMiles,
      bikeSeconds: acc.bikeSeconds + day.bikeSeconds,
      plannedBikeSeconds: acc.plannedBikeSeconds + day.plannedBikeSeconds,
      xtrainSeconds: acc.xtrainSeconds + day.xtrainSeconds,
      plannedXtrainSeconds: acc.plannedXtrainSeconds + day.plannedXtrainSeconds,
    }),
    emptyDayTotals()
  );
}

export function groupActivitiesByDate(
  activities: Activity[]
): Record<string, Activity[]> {
  return activities.reduce<Record<string, Activity[]>>((acc, activity) => {
    const key = toDateKey(new Date(activity.date));
    acc[key] = acc[key] ?? [];
    acc[key].push(activity);
    return acc;
  }, {});
}

export function totalsForActivities(activities: Activity[]): DayTotals {
  return activities.reduce(addToTotals, emptyDayTotals());
}

export function hasAnyTotals(totals: DayTotals): boolean {
  return (
    totals.runMiles > 0 ||
    totals.plannedRunMiles > 0 ||
    totals.bikeSeconds > 0 ||
    totals.plannedBikeSeconds > 0 ||
    totals.xtrainSeconds > 0 ||
    totals.plannedXtrainSeconds > 0
  );
}

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  RUN: "Run",
  BIKE: "Bike",
  XTRAIN: "X-Train",
};

export function buildWeekCalendarData(
  weekDayDates: Date[],
  activities: Activity[],
  today: Date
) {
  const weekDays = weekDayDates.map(toDateKey);
  const byDate = groupActivitiesByDate(activities);
  const dayTotalsList = weekDays.map((key) =>
    totalsForActivities(byDate[key] ?? [])
  );
  const weekTotals = sumTotals(dayTotalsList);
  const todayKey = toDateKey(today);

  return { weekDays, weekTotals, todayKey };
}

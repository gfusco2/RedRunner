import type { Activity, ActivityType } from "@prisma/client";
import { toDateKey } from "./dates";

export type DayTotals = {
  runMiles: number;
  bikeSeconds: number;
  xtrainSeconds: number;
};

export const emptyDayTotals = (): DayTotals => ({
  runMiles: 0,
  bikeSeconds: 0,
  xtrainSeconds: 0,
});

export function addToTotals(totals: DayTotals, activity: Activity): DayTotals {
  const next = { ...totals };
  if (activity.type === "RUN" && activity.distance_miles) {
    next.runMiles += activity.distance_miles;
  }
  if (activity.type === "BIKE" && activity.duration_seconds) {
    next.bikeSeconds += activity.duration_seconds;
  }
  if (activity.type === "XTRAIN" && activity.duration_seconds) {
    next.xtrainSeconds += activity.duration_seconds;
  }
  return next;
}

export function sumTotals(days: DayTotals[]): DayTotals {
  return days.reduce(
    (acc, day) => ({
      runMiles: acc.runMiles + day.runMiles,
      bikeSeconds: acc.bikeSeconds + day.bikeSeconds,
      xtrainSeconds: acc.xtrainSeconds + day.xtrainSeconds,
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

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  RUN: "Run",
  BIKE: "Bike",
  XTRAIN: "X-Train",
};

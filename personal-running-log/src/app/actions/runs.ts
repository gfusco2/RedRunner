"use server";

import { createActivity, getActivitiesForWeek } from "./activities";

/** @deprecated Use createActivity from activities.ts */
export type CreateRunInput = {
  date: string;
  distance_miles: number;
  duration_seconds: number;
  notes?: string | null;
  shoeId?: number | null;
};

/** @deprecated Use createActivity from activities.ts */
export async function createRun(input: CreateRunInput) {
  return createActivity({
    date: input.date,
    type: "RUN",
    distance_miles: input.distance_miles,
    duration_minutes: input.duration_seconds / 60,
    notes: input.notes,
    shoeId: input.shoeId,
  });
}

/** @deprecated Use getActivitiesForWeek from activities.ts */
export async function getRuns() {
  const { getMonday, toDateKey } = await import("lib/training/dates");
  const activities = await getActivitiesForWeek(toDateKey(getMonday(new Date())));
  return activities.filter((a) => a.type === "RUN");
}

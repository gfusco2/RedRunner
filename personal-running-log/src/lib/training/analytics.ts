import type { ActivityTag } from "@prisma/client";
import {
  addWeeks,
  getMonday,
  parseDateKey,
  toDateKey,
} from "lib/training/dates";
import type { ActivityForTotals } from "lib/training/totals";

export type RollingPoint = {
  dateKey: string;
  /** Sum of completed run miles in the trailing 7 days ending on this day. */
  miles: number;
};

export type TagMiles = {
  tag: ActivityTag;
  miles: number;
};

type ActivityForAnalytics = ActivityForTotals & {
  tags?: ActivityTag[];
  planned: boolean;
};

/** Daily completed run miles keyed by date. */
export function dailyCompletedRunMiles(
  activities: ActivityForAnalytics[]
): Record<string, number> {
  const byDay: Record<string, number> = {};
  for (const a of activities) {
    if (a.type !== "RUN" || a.planned || !a.distance_miles) continue;
    const key = toDateKey(new Date(a.date));
    byDay[key] = (byDay[key] ?? 0) + a.distance_miles;
  }
  return byDay;
}

/**
 * Rolling 7-day completed run mileage for each day from startKey..endKey inclusive.
 */
export function buildRolling7DaySeries(
  activities: ActivityForAnalytics[],
  startKey: string,
  endKeyInclusive: string
): RollingPoint[] {
  const daily = dailyCompletedRunMiles(activities);
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKeyInclusive);
  const points: RollingPoint[] = [];

  for (let d = new Date(start.getTime()); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateKey = toDateKey(d);
    let miles = 0;
    for (let i = 0; i < 7; i++) {
      const day = new Date(d.getTime());
      day.setUTCDate(day.getUTCDate() - i);
      miles += daily[toDateKey(day)] ?? 0;
    }
    points.push({ dateKey, miles });
  }
  return points;
}

export function milesByTag(
  activities: ActivityForAnalytics[]
): TagMiles[] {
  const map = new Map<ActivityTag, number>();
  for (const a of activities) {
    if (a.type !== "RUN" || a.planned || !a.distance_miles || !a.tags?.length) {
      continue;
    }
    // Count full activity miles toward each selected tag
    for (const tag of a.tags) {
      map.set(tag, (map.get(tag) ?? 0) + a.distance_miles);
    }
  }
  const order: ActivityTag[] = ["EASY", "WORKOUT", "LONG", "RACE"];
  return order
    .filter((t) => (map.get(t) ?? 0) > 0)
    .map((tag) => ({ tag, miles: map.get(tag)! }));
}

export function weekBoundsAround(today = new Date()) {
  const thisWeekStart = getMonday(today);
  const lastWeekStart = addWeeks(thisWeekStart, -1);
  return {
    thisWeekStart,
    lastWeekStart,
    thisWeekKey: toDateKey(thisWeekStart),
    lastWeekKey: toDateKey(lastWeekStart),
  };
}

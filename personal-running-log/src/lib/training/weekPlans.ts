import type { WeekPlan } from "@prisma/client";
import {
  addWeeks,
  formatWeekLabel,
  getMonday,
  getWeekRange,
  parseDateKey,
  toDateKey,
} from "lib/training/dates";
import { goalBand } from "lib/training/goals";
import type { ChartGoalBand } from "components/dashboard/RollingMileageChart";

export function plansByWeekKey(plans: WeekPlan[]): Record<string, WeekPlan> {
  const map: Record<string, WeekPlan> = {};
  for (const p of plans) {
    map[toDateKey(new Date(p.weekStart))] = p;
  }
  return map;
}

/** Expand week plans into per-day goal bands for the rolling chart. */
export function chartBandsFromPlans(
  plans: WeekPlan[],
  startKey: string,
  endKeyInclusive: string
): ChartGoalBand[] {
  const byWeek = plansByWeekKey(plans);
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKeyInclusive);
  const bands: ChartGoalBand[] = [];

  for (let d = new Date(start.getTime()); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateKey = toDateKey(d);
    const weekKey = toDateKey(getMonday(d));
    const plan = byWeek[weekKey];
    const band = goalBand(plan?.goalRunMiles, plan?.goalRangeMiles);
    if (!band) continue;
    bands.push({
      dateKey,
      low: band.low,
      high: band.high,
      goal: band.goal,
    });
  }
  return bands;
}

export function weekKeysForward(baseWeekStartKey: string, count: number) {
  const base = parseDateKey(baseWeekStartKey);
  return Array.from({ length: count }, (_, i) =>
    toDateKey(addWeeks(base, i))
  );
}

export { formatWeekLabel, getWeekRange };

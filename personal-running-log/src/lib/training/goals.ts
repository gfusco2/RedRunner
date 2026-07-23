/** Default half-width of the weekly goal band (miles). */
export const DEFAULT_GOAL_RANGE_MILES = 5;

export type GoalBand = {
  goal: number;
  range: number;
  low: number;
  high: number;
};

export function resolveGoalRange(rangeMiles?: number | null): number {
  if (rangeMiles != null && Number.isFinite(rangeMiles) && rangeMiles >= 0) {
    return rangeMiles;
  }
  return DEFAULT_GOAL_RANGE_MILES;
}

export function goalBand(
  goalMiles: number | null | undefined,
  rangeMiles?: number | null
): GoalBand | null {
  if (goalMiles == null || !Number.isFinite(goalMiles) || goalMiles <= 0) {
    return null;
  }
  const range = resolveGoalRange(rangeMiles);
  return {
    goal: goalMiles,
    range,
    low: Math.max(0, goalMiles - range),
    high: goalMiles + range,
  };
}

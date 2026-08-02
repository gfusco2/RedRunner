"use client";

import { useEffect, useState, useTransition } from "react";
import type { WeekPlan } from "@prisma/client";
import { getWeekPlan } from "app/actions/weekPlans";
import {
  addWeeks,
  formatWeekLabel,
  getMonday,
  parseDateKey,
  toDateKey,
  localTodayKey,
} from "lib/training/dates";
import WeekGoalEditor from "./WeekGoalEditor";

type Props = {
  /** Starting Monday when the form mounts / parent week changes. */
  baseWeekStartKey: string;
  plansByWeek: Record<string, WeekPlan>;
  athleteId?: string;
};

export default function WeekPlanForm({
  baseWeekStartKey,
  plansByWeek,
  athleteId,
}: Props) {
  const currentWeekKey = toDateKey(getMonday(parseDateKey(localTodayKey())));
  const [selectedKey, setSelectedKey] = useState(baseWeekStartKey);
  const [plan, setPlan] = useState<WeekPlan | null>(
    plansByWeek[baseWeekStartKey] ?? null
  );
  const [loading, startLoad] = useTransition();

  useEffect(() => {
    setSelectedKey(baseWeekStartKey);
  }, [baseWeekStartKey]);

  useEffect(() => {
    const cached = plansByWeek[selectedKey];
    if (cached) {
      setPlan(cached);
      return;
    }
    startLoad(async () => {
      try {
        const fetched = await getWeekPlan(selectedKey, athleteId);
        setPlan(fetched);
      } catch {
        setPlan(null);
      }
    });
  }, [selectedKey, athleteId, plansByWeek]);

  const prevKey = toDateKey(addWeeks(parseDateKey(selectedKey), -1));
  const nextKey = toDateKey(addWeeks(parseDateKey(selectedKey), 1));

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-soft">
      <h2 className="text-lg font-semibold text-ink-900">Week plan</h2>
      <p className="text-xs text-ink-500">
        Set a goal for any week — jump ahead as far as you want. Workouts can
        come later.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedKey(prevKey)}
          className="btn-ghost"
        >
          ← Prev
        </button>
        {selectedKey !== currentWeekKey && (
          <button
            type="button"
            onClick={() => setSelectedKey(currentWeekKey)}
            className="btn-ghost"
          >
            This week
          </button>
        )}
        <button
          type="button"
          onClick={() => setSelectedKey(nextKey)}
          className="btn-ghost"
        >
          Next →
        </button>
      </div>
      <p className="mt-2 text-xs font-medium text-ink-700">
        {formatWeekLabel(parseDateKey(selectedKey))}
        {selectedKey === currentWeekKey ? " · this week" : ""}
        {loading
          ? " · loading…"
          : plan?.goalRunMiles != null
            ? ` · goal ${plan.goalRunMiles.toFixed(0)}`
            : " · no goal yet"}
      </p>

      <div className="mt-3">
        <WeekGoalEditor
          key={selectedKey}
          weekStartKey={selectedKey}
          initial={plan}
          athleteId={athleteId}
        />
      </div>
    </div>
  );
}

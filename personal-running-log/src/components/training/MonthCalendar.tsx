"use client";

import type { ActivityWithDetails } from "app/actions/activities";
import type { WeekPlan } from "@prisma/client";
import { useState } from "react";
import {
  groupActivitiesByDate,
  hasAnyTotals,
  totalsForActivities,
  type DayTotals,
} from "lib/training/totals";
import {
  WEEKDAY_LABELS,
  formatWeekLabel,
  parseDateKey,
} from "lib/training/dates";
import { formatDistance, formatDuration } from "lib/training/format";
import { usePreferences } from "lib/preferences";
import type { GoalBand } from "lib/training/goals";
import type { DistanceUnit } from "lib/training/format";
import WeekGoalEditor from "components/dashboard/WeekGoalEditor";
import DayTotalsDisplay from "./DayTotalsDisplay";
import DayDetailPanel from "./DayDetailPanel";

export type CalendarWeek = {
  weekStartKey: string;
  weekDays: string[];
  weekTotals: DayTotals;
  /** Real current week — taller + red tint on desktop */
  emphasized?: boolean;
  goal?: GoalBand | null;
};

type MonthCalendarProps = {
  weeks: CalendarWeek[];
  activities: ActivityWithDetails[];
  todayKey: string;
  periodTotals: DayTotals;
  focusGoal?: GoalBand | null;
  plansByWeek?: Record<string, WeekPlan>;
  canEditGoals?: boolean;
  athleteId?: string;
};

function summaryLine(totals: DayTotals, unit: DistanceUnit): string {
  const bits: string[] = [];
  if (totals.runMiles > 0) bits.push(formatDistance(totals.runMiles, unit));
  if (totals.plannedRunMiles > 0) {
    bits.push(`Plan ${formatDistance(totals.plannedRunMiles, unit)}`);
  }
  if (totals.bikeSeconds > 0) {
    bits.push(`Bike ${formatDuration(totals.bikeSeconds)}`);
  }
  if (totals.xtrainSeconds > 0) {
    bits.push(`XT ${formatDuration(totals.xtrainSeconds)}`);
  }
  return bits.length > 0 ? bits.join(" · ") : "—";
}

export default function MonthCalendar({
  weeks,
  activities,
  todayKey,
  periodTotals,
  focusGoal,
  plansByWeek = {},
  canEditGoals = false,
  athleteId,
}: MonthCalendarProps) {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [editingWeekKey, setEditingWeekKey] = useState<string | null>(null);
  const byDate = groupActivitiesByDate(activities);
  const { unit } = usePreferences();
  const zeroLabel = unit === "km" ? "0.0 km" : "0.0 mi";
  const editingPlan = editingWeekKey
    ? plansByWeek[editingWeekKey] ?? null
    : null;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-ink-100 bg-white px-3 py-3 shadow-soft sm:gap-4 sm:px-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-700">
            Actual
          </p>
          <p className="text-lg font-semibold text-brand-700 sm:text-xl">
            {periodTotals.runMiles > 0
              ? formatDistance(periodTotals.runMiles, unit)
              : zeroLabel}
          </p>
        </div>
        <div className="hidden h-8 w-px bg-ink-100 sm:block" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-600">
            Goal
          </p>
          <p className="text-lg font-semibold text-ink-900 sm:text-xl">
            {focusGoal ? formatDistance(focusGoal.goal, unit) : zeroLabel}
          </p>
          {focusGoal && (
            <p className="text-[10px] text-ink-500">
              {formatDistance(focusGoal.low, unit)}–
              {formatDistance(focusGoal.high, unit)}
            </p>
          )}
        </div>
        <div className="hidden h-8 w-px bg-ink-100 sm:block" />
        <div className="opacity-70">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
            Planned
          </p>
          <p className="text-base font-medium text-ink-500 sm:text-lg">
            {periodTotals.plannedRunMiles > 0
              ? formatDistance(periodTotals.plannedRunMiles, unit)
              : zeroLabel}
          </p>
        </div>
      </div>

      {/* Mobile: stacked day lists per week */}
      <div className="space-y-4 md:hidden">
        {weeks.map((week) => {
          const tall = Boolean(week.emphasized);
          return (
            <section
              key={week.weekStartKey}
              className={`overflow-hidden rounded-xl border ${
                tall
                  ? "border-brand-300 bg-brand-50"
                  : "border-ink-100 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2 border-b border-ink-100 px-3 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-ink-800">
                    {formatWeekLabel(parseDateKey(week.weekStartKey))}
                  </p>
                  {tall && (
                    <span className="mt-1 inline-block rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                      Current week
                    </span>
                  )}
                  {week.goal ? (
                    <p className="mt-1 text-[11px] text-ink-500">
                      Goal {formatDistance(week.goal.goal, unit)} (
                      {formatDistance(week.goal.low, unit)}–
                      {formatDistance(week.goal.high, unit)})
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-ink-400">No goal set</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                    Week
                  </p>
                  <p className="text-xs font-medium text-brand-700">
                    {week.weekTotals.runMiles > 0
                      ? formatDistance(week.weekTotals.runMiles, unit)
                      : zeroLabel}
                  </p>
                  {canEditGoals && (
                    <button
                      type="button"
                      onClick={() => setEditingWeekKey(week.weekStartKey)}
                      className="mt-1 text-[11px] font-semibold text-brand-600"
                    >
                      {week.goal ? "Edit" : "Set goal"}
                    </button>
                  )}
                </div>
              </div>

              <ul className="divide-y divide-ink-100">
                {week.weekDays.map((dateKey, i) => {
                  const date = new Date(dateKey + "T12:00:00");
                  const totals = totalsForActivities(byDate[dateKey] ?? []);
                  const isToday = dateKey === todayKey;
                  const count = byDate[dateKey]?.length ?? 0;

                  return (
                    <li key={dateKey}>
                      <button
                        type="button"
                        onClick={() => setSelectedDateKey(dateKey)}
                        className={`flex min-h-[52px] w-full items-center gap-3 px-3 py-2.5 text-left ${
                          isToday ? "bg-brand-50" : "bg-transparent"
                        }`}
                      >
                        <div className="w-10 shrink-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                            {WEEKDAY_LABELS[i]}
                          </p>
                          <p
                            className={`text-base font-semibold leading-tight ${
                              isToday ? "text-brand-700" : "text-ink-900"
                            }`}
                          >
                            {date.getDate()}
                          </p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-ink-700">
                            {summaryLine(totals, unit)}
                          </p>
                        </div>
                        {count > 0 && (
                          <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-medium text-ink-500">
                            {count}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Desktop: week grid */}
      <div className="hidden md:block">
        <div className="space-y-4">
          <div className="grid grid-cols-8 gap-2 px-0.5">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="px-1 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-500"
              >
                {label}
              </div>
            ))}
            <div className="px-1 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              Week
            </div>
          </div>

          {weeks.map((week) => {
            const tall = Boolean(week.emphasized);
            const cellMin = tall ? "min-h-[160px]" : "min-h-[120px]";

            return (
              <div
                key={week.weekStartKey}
                className={
                  tall
                    ? "rounded-2xl border border-brand-200 bg-brand-50 p-3"
                    : undefined
                }
              >
                <p className="mb-1.5 text-xs font-medium text-ink-500">
                  {formatWeekLabel(parseDateKey(week.weekStartKey))}
                  {tall && (
                    <span className="ml-2 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                      Current week
                    </span>
                  )}
                </p>
                <div className="grid grid-cols-8 gap-2">
                  {week.weekDays.map((dateKey) => {
                    const date = new Date(dateKey + "T12:00:00");
                    const totals = totalsForActivities(byDate[dateKey] ?? []);
                    const isToday = dateKey === todayKey;
                    const count = byDate[dateKey]?.length ?? 0;

                    return (
                      <button
                        key={dateKey}
                        type="button"
                        onClick={() => setSelectedDateKey(dateKey)}
                        className={`${cellMin} rounded-xl border p-2.5 text-left transition hover:border-brand-300 hover:shadow-soft ${
                          isToday
                            ? "border-brand-500 bg-white ring-1 ring-brand-300"
                            : tall
                              ? "border-brand-100 bg-white"
                              : "border-ink-100 bg-white"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className={`text-sm font-semibold ${
                              isToday ? "text-brand-700" : "text-ink-900"
                            }`}
                          >
                            {date.getDate()}
                          </span>
                          {count > 0 && (
                            <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] text-ink-500">
                              {count}
                            </span>
                          )}
                        </div>
                        <DayTotalsDisplay totals={totals} compact />
                      </button>
                    );
                  })}

                  <div
                    className={`${cellMin} flex flex-col rounded-xl border-2 p-2.5 ${
                      tall
                        ? "border-brand-300 bg-white bg-opacity-80"
                        : "border-ink-200 bg-ink-50"
                    }`}
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                      Total
                    </p>
                    {week.goal ? (
                      <p className="mb-1.5 text-[10px] text-ink-500">
                        Goal {formatDistance(week.goal.goal, unit)}
                        <span className="text-ink-400">
                          {" "}
                          ({formatDistance(week.goal.low, unit)}–
                          {formatDistance(week.goal.high, unit)})
                        </span>
                      </p>
                    ) : (
                      <p className="mb-1.5 text-[10px] text-ink-300">No goal</p>
                    )}
                    {hasAnyTotals(week.weekTotals) ? (
                      <DayTotalsDisplay totals={week.weekTotals} compact />
                    ) : (
                      <p className="text-xs text-ink-200">—</p>
                    )}
                    {canEditGoals && (
                      <button
                        type="button"
                        onClick={() => setEditingWeekKey(week.weekStartKey)}
                        className="mt-auto pt-2 text-left text-[11px] font-semibold text-brand-600 hover:text-brand-800"
                      >
                        {week.goal ? "Edit goal" : "Set goal"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDateKey && (
        <DayDetailPanel
          dateKey={selectedDateKey}
          activities={byDate[selectedDateKey] ?? []}
          onClose={() => setSelectedDateKey(null)}
        />
      )}

      {editingWeekKey && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950 bg-opacity-50 p-0 sm:items-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingWeekKey(null);
          }}
        >
          <div className="w-full max-w-md rounded-t-xl bg-white p-4 shadow-soft sm:rounded-xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                  Week goal
                </p>
                <h3 className="text-lg font-semibold text-ink-900">
                  {formatWeekLabel(parseDateKey(editingWeekKey))}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingWeekKey(null)}
                className="rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
              >
                Close
              </button>
            </div>
            <WeekGoalEditor
              weekStartKey={editingWeekKey}
              initial={editingPlan}
              athleteId={athleteId}
              compact
              onSaved={() => setEditingWeekKey(null)}
              onCancel={() => setEditingWeekKey(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}

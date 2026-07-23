"use client";

import type { Activity } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteActivity,
  markActivityCompleted,
} from "app/actions/activities";
import {
  formatDistance,
  formatDuration,
  formatMinSec,
  formatPaceDisplay,
  formatScore,
} from "lib/training/format";
import { ACTIVITY_LABELS } from "lib/training/totals";
import { parseDateKey } from "lib/training/dates";
import { usePreferences } from "lib/preferences";
import ActivityForm from "./ActivityForm";

type DayDetailPanelProps = {
  dateKey: string;
  activities: Activity[];
  onClose: () => void;
};

const SCORE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

export default function DayDetailPanel({
  dateKey,
  activities,
  onClose,
}: DayDetailPanelProps) {
  const router = useRouter();
  const { unit } = usePreferences();
  const [pending, startTransition] = useTransition();
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const dateLabel = parseDateKey(dateKey).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  function refresh() {
    router.refresh();
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      await deleteActivity(id);
      refresh();
    });
  }

  function handleComplete(
    e: React.FormEvent<HTMLFormElement>,
    id: number
  ) {
    e.preventDefault();
    setCompleteError(null);
    const formData = new FormData(e.currentTarget);
    const difficulty = Number(formData.get("difficulty"));
    const feel = Number(formData.get("feel"));

    startTransition(async () => {
      try {
        await markActivityCompleted(id, { difficulty, feel });
        setCompletingId(null);
        refresh();
      } catch (err) {
        setCompleteError(
          err instanceof Error ? err.message : "Could not complete workout."
        );
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
          <h2 className="text-lg font-semibold text-ink-900">{dateLabel}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-ink-500 hover:bg-ink-50"
          >
            Close
          </button>
        </div>

        <div className="space-y-5 p-4">
          <section>
            <h3 className="label-field mb-2">Activities</h3>
            {activities.length === 0 ? (
              <p className="text-sm text-ink-500">
                Nothing logged yet — add one below.
              </p>
            ) : (
              <ul className="divide-y divide-ink-100 overflow-hidden rounded-lg border border-ink-100">
                {activities.map((activity) => {
                  const enteredPace =
                    activity.type === "RUN"
                      ? formatPaceDisplay(activity.pace_seconds, unit)
                      : null;

                  return (
                    <li key={activity.id} className="px-3 py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-ink-900">
                              {activity.name?.trim() ||
                                ACTIVITY_LABELS[activity.type]}
                            </p>
                            {activity.planned ? (
                              <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-600">
                                Planned
                              </span>
                            ) : (
                              <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                                Done
                              </span>
                            )}
                            {activity.name?.trim() && (
                              <span className="text-xs text-ink-500">
                                {ACTIVITY_LABELS[activity.type]}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-ink-500">
                            {activity.type === "RUN" &&
                              activity.distance_miles != null &&
                              formatDistance(activity.distance_miles, unit)}
                            {activity.type !== "RUN" &&
                              activity.duration_seconds != null &&
                              formatDuration(activity.duration_seconds)}
                            {activity.type === "RUN" &&
                              activity.duration_seconds != null &&
                              ` · ${formatMinSec(activity.duration_seconds)}`}
                            {enteredPace && ` · ${enteredPace}`}
                          </p>
                          {!activity.planned && (
                            <p className="mt-0.5 text-xs text-ink-500">
                              Diff {formatScore(activity.difficulty)} · Feel{" "}
                              {formatScore(activity.feel)}
                            </p>
                          )}
                          {activity.notes && (
                            <p className="mt-1 text-xs text-ink-500">
                              {activity.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {activity.planned && completingId !== activity.id && (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => {
                                setCompletingId(activity.id);
                                setCompleteError(null);
                              }}
                              className="text-xs font-medium text-brand-600 hover:text-brand-800 disabled:opacity-50"
                            >
                              Mark done
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleDelete(activity.id)}
                            className="text-xs text-ink-500 hover:text-brand-700 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {activity.planned && completingId === activity.id && (
                        <form
                          onSubmit={(e) => handleComplete(e, activity.id)}
                          className="mt-3 space-y-2 rounded-lg border border-brand-100 bg-brand-50/50 p-3"
                        >
                          <p className="text-xs font-medium text-ink-700">
                            Rate this workout to mark it complete
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="label-field">Difficulty</label>
                              <select
                                name="difficulty"
                                required
                                className="input-field"
                                defaultValue=""
                              >
                                <option value="" disabled>
                                  1–10
                                </option>
                                {SCORE_OPTIONS.map((n) => (
                                  <option key={n} value={n}>
                                    {n}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="label-field">Feel</label>
                              <select
                                name="feel"
                                required
                                className="input-field"
                                defaultValue=""
                              >
                                <option value="" disabled>
                                  1–10
                                </option>
                                {SCORE_OPTIONS.map((n) => (
                                  <option key={n} value={n}>
                                    {n}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          {completeError && (
                            <p className="text-xs text-brand-600">{completeError}</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={pending}
                              className="btn-primary flex-1"
                            >
                              {pending ? "Saving…" : "Complete"}
                            </button>
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => setCompletingId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h3 className="label-field mb-2">Add</h3>
            <ActivityForm dateKey={dateKey} onSuccess={refresh} />
          </section>
        </div>
      </div>
    </div>
  );
}

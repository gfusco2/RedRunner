"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { ActivityWithDetails } from "app/actions/activities";
import { deleteActivity } from "app/actions/activities";
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
import {
  SEGMENT_KIND_SHORT,
  TAG_LABELS,
  TAG_PILL_CLASS,
} from "lib/training/tags";
import ActivityForm from "./ActivityForm";
import CompleteWorkoutForm from "./CompleteWorkoutForm";
import DayWellnessForm from "./DayWellnessForm";

type DayDetailPanelProps = {
  dateKey: string;
  activities: ActivityWithDetails[];
  onClose: () => void;
};

export default function DayDetailPanel({
  dateKey,
  activities,
  onClose,
}: DayDetailPanelProps) {
  const router = useRouter();
  const { unit } = usePreferences();
  const [pending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeMode, setActiveMode] = useState<"complete" | "edit" | null>(
    null
  );
  const [showAdd, setShowAdd] = useState(activities.length === 0);
  const dateLabel = parseDateKey(dateKey).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function refresh() {
    router.refresh();
  }

  function handleDelete(id: number) {
    if (!window.confirm("Remove this activity?")) return;
    startTransition(async () => {
      await deleteActivity(id);
      if (activeId === id) {
        setActiveId(null);
        setActiveMode(null);
      }
      refresh();
    });
  }

  function openForm(id: number, mode: "complete" | "edit") {
    setActiveId(id);
    setActiveMode(mode);
  }

  function closeForm() {
    setActiveId(null);
    setActiveMode(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-ink-950 bg-opacity-50 p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-t-xl bg-white shadow-soft sm:rounded-xl"
        style={{ height: "min(92dvh, 920px)", maxHeight: "92dvh" }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-ink-100 bg-white px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
              Day detail
            </p>
            <h2 className="text-lg font-semibold text-ink-900">{dateLabel}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            Close
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
          style={{ minHeight: 0, WebkitOverflowScrolling: "touch" }}
        >
          <section className="mb-5">
            <h3 className="label-field mb-2">Activities</h3>
            {activities.length === 0 ? (
              <p className="rounded-lg border border-dashed border-ink-200 bg-ink-50 px-3 py-4 text-sm text-ink-500">
                Nothing yet — add one below.
              </p>
            ) : (
              <ul className="space-y-2">
                {activities.map((activity) => {
                  const enteredPace =
                    activity.type === "RUN"
                      ? formatPaceDisplay(activity.pace_seconds, unit)
                      : null;
                  const formOpen =
                    activeId === activity.id && activeMode != null;

                  return (
                    <li
                      key={activity.id}
                      className="rounded-lg border border-ink-100 bg-white px-3 py-2.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-ink-900">
                              {activity.name?.trim() ||
                                ACTIVITY_LABELS[activity.type]}
                            </p>
                            {activity.planned ? (
                              <span className="rounded bg-gold-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-700">
                                Planned
                              </span>
                            ) : (
                              <span className="rounded bg-trail-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-trail-700">
                                Done
                              </span>
                            )}
                            {activity.prescribedById && (
                              <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                                From coach
                              </span>
                            )}
                          </div>

                          {activity.tags.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {activity.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${TAG_PILL_CLASS[tag]}`}
                                >
                                  {TAG_LABELS[tag]}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="mt-1 text-sm font-medium text-brand-700">
                            {activity.type === "RUN" &&
                              activity.distance_miles != null &&
                              `Total ${formatDistance(activity.distance_miles, unit)}`}
                            {activity.type !== "RUN" &&
                              activity.duration_seconds != null &&
                              formatDuration(activity.duration_seconds)}
                            {activity.type === "RUN" &&
                              activity.duration_seconds != null &&
                              ` · ${formatMinSec(activity.duration_seconds)}`}
                            {enteredPace && ` · main ${enteredPace}`}
                          </p>

                          {activity.segments.length > 0 && (
                            <ul className="mt-1.5 space-y-0.5 text-xs text-ink-500">
                              {activity.segments.map((seg) => {
                                const bits: string[] = [
                                  SEGMENT_KIND_SHORT[seg.kind],
                                ];
                                if (seg.distance_miles != null) {
                                  bits.push(
                                    formatDistance(seg.distance_miles, unit)
                                  );
                                }
                                if (seg.duration_seconds != null) {
                                  bits.push(formatMinSec(seg.duration_seconds));
                                }
                                if (seg.pace_seconds != null) {
                                  const p = formatPaceDisplay(
                                    seg.pace_seconds,
                                    unit
                                  );
                                  if (p) bits.push(p);
                                }
                                return (
                                  <li key={seg.id}>
                                    {bits.join(" · ")}
                                    {seg.notes ? ` — ${seg.notes}` : ""}
                                  </li>
                                );
                              })}
                            </ul>
                          )}

                          {!activity.planned && (
                            <p className="mt-0.5 text-xs text-ink-500">
                              Diff {formatScore(activity.difficulty)} · Feel{" "}
                              {formatScore(activity.feel)}
                            </p>
                          )}
                          {activity.splits?.length > 0 && (
                            <ul className="mt-1.5 space-y-0.5 text-xs text-ink-600">
                              {activity.splits.map((split) => {
                                const bits: string[] = [
                                  split.label || "Rep",
                                ];
                                if (split.distance_miles != null) {
                                  const meters = Math.round(
                                    split.distance_miles * 1609.34
                                  );
                                  bits.push(
                                    meters >= 100 && meters % 100 === 0
                                      ? `${meters}m`
                                      : formatDistance(
                                          split.distance_miles,
                                          unit
                                        )
                                  );
                                }
                                if (split.duration_seconds != null) {
                                  bits.push(
                                    formatMinSec(split.duration_seconds)
                                  );
                                }
                                if (split.rest_seconds != null) {
                                  bits.push(`${split.rest_seconds}s rest`);
                                }
                                return (
                                  <li key={split.id}>{bits.join(" · ")}</li>
                                );
                              })}
                            </ul>
                          )}
                          {activity.notes && (
                            <p className="mt-1 text-xs text-ink-500">
                              {activity.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          {activity.planned && !formOpen && (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => openForm(activity.id, "complete")}
                              className="text-xs font-semibold text-brand-600 hover:text-brand-800 disabled:opacity-50"
                            >
                              Mark done
                            </button>
                          )}
                          {!activity.planned && !formOpen && (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => openForm(activity.id, "edit")}
                              className="text-xs font-semibold text-brand-600 hover:text-brand-800 disabled:opacity-50"
                            >
                              Edit
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

                      {formOpen && activeMode && (
                        <CompleteWorkoutForm
                          key={`${activity.id}-${activeMode}`}
                          activity={activity}
                          mode={activeMode}
                          onDone={() => {
                            closeForm();
                            refresh();
                          }}
                          onCancel={closeForm}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="mb-5">
            <DayWellnessForm dateKey={dateKey} />
          </section>

          <section className="rounded-xl border border-ink-100 bg-ink-50 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-ink-900">Add activity</h3>
              {activities.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAdd((v) => !v)}
                  className="text-xs font-semibold text-brand-600"
                >
                  {showAdd ? "Hide" : "Show"}
                </button>
              )}
            </div>
            {showAdd && (
              <ActivityForm
                dateKey={dateKey}
                onSuccess={() => {
                  setShowAdd(false);
                  refresh();
                }}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

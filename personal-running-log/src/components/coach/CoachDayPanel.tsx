"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ActivityWithDetails } from "app/actions/activities";
import { deleteActivity } from "app/actions/activities";
import {
  formatDistance,
  formatMinSec,
  formatPaceDisplay,
} from "lib/training/format";
import { ACTIVITY_LABELS } from "lib/training/totals";
import { parseDateKey } from "lib/training/dates";
import { usePreferences } from "lib/preferences";
import { SEGMENT_KIND_SHORT, TAG_LABELS, TAG_PILL_CLASS } from "lib/training/tags";
import PrescribeWorkoutForm from "./PrescribeWorkoutForm";

type Props = {
  dateKey: string;
  athleteId: string;
  activities: ActivityWithDetails[];
  onClose: () => void;
};

export default function CoachDayPanel({
  dateKey,
  athleteId,
  activities,
  onClose,
}: Props) {
  const router = useRouter();
  const { unit } = usePreferences();
  const [pending, startTransition] = useTransition();
  const dateLabel = parseDateKey(dateKey).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-ink-950 bg-opacity-50 p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-t-xl bg-white shadow-soft sm:rounded-xl"
        style={{ height: "min(90dvh, 900px)", maxHeight: "90dvh" }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-ink-100 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-600">
              Prescribe
            </p>
            <h2 className="text-lg font-semibold text-ink-900">{dateLabel}</h2>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost">
            Close
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
          style={{ minHeight: 0, WebkitOverflowScrolling: "touch" }}
        >
          <section className="mb-5">
            <h3 className="label-field mb-2">On this day</h3>
            {activities.length === 0 ? (
              <p className="rounded-lg border border-dashed border-ink-200 bg-ink-50 px-3 py-3 text-sm text-ink-500">
                Nothing planned or logged yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {activities.map((activity) => (
                  <li
                    key={activity.id}
                    className="rounded-lg border border-ink-100 bg-white px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-ink-900">
                            {activity.name?.trim() ||
                              ACTIVITY_LABELS[activity.type]}
                          </p>
                          {activity.prescribedById && (
                            <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-700">
                              Coach
                            </span>
                          )}
                          {activity.planned ? (
                            <span className="rounded bg-gold-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gold-700">
                              Planned
                            </span>
                          ) : (
                            <span className="rounded bg-trail-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-trail-700">
                              Done
                            </span>
                          )}
                        </div>
                        {activity.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
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
                        <p className="mt-1 text-sm text-ink-500">
                          {activity.type === "RUN" &&
                            activity.distance_miles != null &&
                            formatDistance(activity.distance_miles, unit)}
                          {activity.pace_seconds != null &&
                            ` · ${formatPaceDisplay(activity.pace_seconds, unit)}`}
                        </p>
                        {activity.segments.map((seg) => (
                          <p key={seg.id} className="text-xs text-ink-500">
                            {SEGMENT_KIND_SHORT[seg.kind]}
                            {seg.distance_miles != null
                              ? ` · ${formatDistance(seg.distance_miles, unit)}`
                              : ""}
                            {seg.duration_seconds != null
                              ? ` · ${formatMinSec(seg.duration_seconds)}`
                              : ""}
                            {seg.notes ? ` — ${seg.notes}` : ""}
                          </p>
                        ))}
                      </div>
                      {activity.prescribedById && activity.planned && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleDelete(activity.id)}
                          className="text-xs text-ink-500 hover:text-brand-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-brand-100 bg-brand-50 p-3">
            <h3 className="mb-3 text-sm font-bold text-ink-900">
              Add prescription
            </h3>
            <PrescribeWorkoutForm
              dateKey={dateKey}
              athleteId={athleteId}
              onSuccess={refresh}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

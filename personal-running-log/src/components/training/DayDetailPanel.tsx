"use client";

import type { Activity } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  deleteActivity,
  markActivityCompleted,
} from "app/actions/activities";
import { formatDuration, formatMiles } from "lib/training/format";
import { ACTIVITY_LABELS } from "lib/training/totals";
import { parseDateKey } from "lib/training/dates";
import ActivityForm from "./ActivityForm";

type DayDetailPanelProps = {
  dateKey: string;
  activities: Activity[];
  onClose: () => void;
};

export default function DayDetailPanel({
  dateKey,
  activities,
  onClose,
}: DayDetailPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
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

  function handleComplete(id: number) {
    startTransition(async () => {
      await markActivityCompleted(id);
      refresh();
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
              <p className="text-sm text-ink-500">Nothing logged yet — add one below.</p>
            ) : (
              <ul className="divide-y divide-ink-100 overflow-hidden rounded-lg border border-ink-100">
                {activities.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex items-start justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-ink-900">
                          {activity.name?.trim() || ACTIVITY_LABELS[activity.type]}
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
                          formatMiles(activity.distance_miles)}
                        {activity.type !== "RUN" &&
                          activity.duration_seconds != null &&
                          formatDuration(activity.duration_seconds)}
                        {activity.type === "RUN" &&
                          activity.duration_seconds != null &&
                          ` · ${formatDuration(activity.duration_seconds)}`}
                      </p>
                      {activity.notes && (
                        <p className="mt-1 text-xs text-ink-500">{activity.notes}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {activity.planned && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleComplete(activity.id)}
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
                  </li>
                ))}
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

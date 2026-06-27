"use client";

import type { Activity } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteActivity } from "app/actions/activities";
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">{dateLabel}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 p-4">
          <section>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Activities
            </h3>
            {activities.length === 0 ? (
              <p className="text-sm text-gray-500">No activities logged yet.</p>
            ) : (
              <ul className="divide-y rounded border">
                {activities.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex items-start justify-between gap-3 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {ACTIVITY_LABELS[activity.type]}
                      </p>
                      <p className="text-sm text-gray-600">
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
                        <p className="mt-1 text-xs text-gray-500">{activity.notes}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleDelete(activity.id)}
                      className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Add activity
            </h3>
            <ActivityForm dateKey={dateKey} onSuccess={refresh} />
          </section>
        </div>
      </div>
    </div>
  );
}

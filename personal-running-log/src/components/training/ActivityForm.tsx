"use client";

import type { ActivityType } from "@prisma/client";
import { useState, useTransition } from "react";
import { createActivity } from "app/actions/activities";

type ActivityFormProps = {
  dateKey: string;
  onSuccess?: () => void;
};

export default function ActivityForm({ dateKey, onSuccess }: ActivityFormProps) {
  const [type, setType] = useState<ActivityType>("RUN");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const distance = formData.get("distance_miles");
    const duration = formData.get("duration_minutes");
    const notes = formData.get("notes");

    startTransition(async () => {
      try {
        await createActivity({
          date: dateKey,
          type,
          distance_miles: distance ? Number(distance) : null,
          duration_minutes: duration ? Number(duration) : null,
          notes: typeof notes === "string" ? notes : null,
        });
        form.reset();
        setType("RUN");
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save activity.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ActivityType)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="RUN">Run</option>
          <option value="BIKE">Bike</option>
          <option value="XTRAIN">X-Train</option>
        </select>
      </div>

      {type === "RUN" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Distance (miles)
          </label>
          <input
            name="distance_miles"
            type="number"
            step="0.1"
            min="0.1"
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="5.0"
          />
        </div>
      )}

      {type === "RUN" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Duration (minutes, optional)
          </label>
          <input
            name="duration_minutes"
            type="number"
            step="1"
            min="1"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="45"
          />
        </div>
      )}

      {(type === "BIKE" || type === "XTRAIN") && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Duration (minutes)
          </label>
          <input
            name="duration_minutes"
            type="number"
            step="1"
            min="1"
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="45"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          name="notes"
          rows={2}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="Optional"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add activity"}
      </button>
    </form>
  );
}

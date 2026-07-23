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
  const [planned, setPlanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name");
    const distance = formData.get("distance_miles");
    const duration = formData.get("duration_minutes");
    const notes = formData.get("notes");

    startTransition(async () => {
      try {
        await createActivity({
          date: dateKey,
          type,
          name: typeof name === "string" ? name : null,
          planned,
          distance_miles: distance ? Number(distance) : null,
          duration_minutes: duration ? Number(duration) : null,
          notes: typeof notes === "string" ? notes : null,
        });
        form.reset();
        setType("RUN");
        setPlanned(false);
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save activity.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label-field">Name</label>
        <input
          name="name"
          type="text"
          className="input-field"
          placeholder="Easy aerobic · Tempo · Long run"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-field">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ActivityType)}
            className="input-field"
          >
            <option value="RUN">Run</option>
            <option value="BIKE">Bike</option>
            <option value="XTRAIN">X-Train</option>
          </select>
        </div>
        <div>
          <label className="label-field">Status</label>
          <select
            value={planned ? "planned" : "completed"}
            onChange={(e) => setPlanned(e.target.value === "planned")}
            className="input-field"
          >
            <option value="completed">Completed</option>
            <option value="planned">Planned</option>
          </select>
        </div>
      </div>

      {type === "RUN" && (
        <div>
          <label className="label-field">Distance (miles)</label>
          <input
            name="distance_miles"
            type="number"
            step="0.1"
            min="0.1"
            required
            className="input-field"
            placeholder="5.0"
          />
        </div>
      )}

      {type === "RUN" && (
        <div>
          <label className="label-field">Duration (minutes, optional)</label>
          <input
            name="duration_minutes"
            type="number"
            step="1"
            min="1"
            className="input-field"
            placeholder="45"
          />
        </div>
      )}

      {(type === "BIKE" || type === "XTRAIN") && (
        <div>
          <label className="label-field">Duration (minutes)</label>
          <input
            name="duration_minutes"
            type="number"
            step="1"
            min="1"
            required
            className="input-field"
            placeholder="45"
          />
        </div>
      )}

      <div>
        <label className="label-field">Notes</label>
        <textarea
          name="notes"
          rows={2}
          className="input-field"
          placeholder="Optional"
        />
      </div>

      {error && <p className="text-sm text-brand-600">{error}</p>}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending
          ? "Saving…"
          : planned
            ? "Add planned workout"
            : "Log activity"}
      </button>
    </form>
  );
}

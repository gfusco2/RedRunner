"use client";

import type { ActivityType } from "@prisma/client";
import { useState, useTransition } from "react";
import { createActivity } from "app/actions/activities";
import { parseMinSec, kmToMiles } from "lib/training/format";
import { usePreferences } from "lib/preferences";

type ActivityFormProps = {
  dateKey: string;
  onSuccess?: () => void;
};

const SCORE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

const compactInput =
  "w-14 rounded-md border border-ink-200 bg-white px-2 py-1.5 text-center text-sm text-ink-900 outline-none focus:border-brand-500";

export default function ActivityForm({ dateKey, onSuccess }: ActivityFormProps) {
  const { unit } = usePreferences();
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
    const distanceRaw = formData.get("distance");
    const notes = formData.get("notes");
    const difficulty = formData.get("difficulty");
    const feel = formData.get("feel");

    startTransition(async () => {
      try {
        const duration_seconds = parseMinSec(
          formData.get("duration_min") as string,
          formData.get("duration_sec") as string
        );
        // Pace is always entered as min/sec per preferred distance unit;
        // store as seconds per mile for consistency.
        let pace_seconds = parseMinSec(
          formData.get("pace_min") as string,
          formData.get("pace_sec") as string
        );
        if (pace_seconds != null && unit === "km") {
          // sec/km → sec/mi
          pace_seconds = Math.round(pace_seconds * 1.60934);
        }

        const distanceNum = distanceRaw ? Number(distanceRaw) : null;
        const distance_miles =
          distanceNum == null
            ? null
            : unit === "km"
              ? kmToMiles(distanceNum)
              : distanceNum;

        await createActivity({
          date: dateKey,
          type,
          name: typeof name === "string" ? name : null,
          planned,
          distance_miles,
          duration_seconds,
          pace_seconds,
          difficulty: difficulty ? Number(difficulty) : null,
          feel: feel ? Number(feel) : null,
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field">
              Distance ({unit === "km" ? "km" : "mi"})
            </label>
            <input
              name="distance"
              type="number"
              step="0.1"
              min="0.1"
              required
              className="input-field"
              placeholder={unit === "km" ? "8.0" : "5.0"}
            />
          </div>
          <div>
            <label className="label-field">
              Pace (min / {unit === "km" ? "km" : "mi"})
            </label>
            <div className="flex items-center gap-1">
              <input
                name="pace_min"
                type="number"
                min="0"
                step="1"
                className={compactInput}
                placeholder="7"
                aria-label="Pace minutes"
              />
              <span className="text-sm font-medium text-ink-500">:</span>
              <input
                name="pace_sec"
                type="number"
                min="0"
                max="59"
                step="1"
                className={compactInput}
                placeholder="30"
                aria-label="Pace seconds"
              />
            </div>
          </div>
        </div>
      )}

      {type === "RUN" && (
        <div>
          <label className="label-field">
            Time{planned ? " (optional)" : ""}
          </label>
          <div className="flex items-center gap-1">
            <input
              name="duration_min"
              type="number"
              min="0"
              step="1"
              className={compactInput}
              placeholder="45"
              aria-label="Minutes"
            />
            <span className="text-xs text-ink-500">min</span>
            <input
              name="duration_sec"
              type="number"
              min="0"
              max="59"
              step="1"
              className={compactInput}
              placeholder="00"
              aria-label="Seconds"
            />
            <span className="text-xs text-ink-500">sec</span>
          </div>
        </div>
      )}

      {(type === "BIKE" || type === "XTRAIN") && (
        <div>
          <label className="label-field">Time</label>
          <div className="flex items-center gap-1">
            <input
              name="duration_min"
              type="number"
              min="0"
              step="1"
              required
              className={compactInput}
              placeholder="45"
              aria-label="Minutes"
            />
            <span className="text-xs text-ink-500">min</span>
            <input
              name="duration_sec"
              type="number"
              min="0"
              max="59"
              step="1"
              className={compactInput}
              placeholder="00"
              aria-label="Seconds"
            />
            <span className="text-xs text-ink-500">sec</span>
          </div>
        </div>
      )}

      {!planned && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field">Difficulty (1–10)</label>
            <select
              name="difficulty"
              required
              className="input-field"
              defaultValue=""
            >
              <option value="" disabled>
                How hard?
              </option>
              {SCORE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                  {n === 1 ? " · easy" : n === 10 ? " · max" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Feel (1–10)</label>
            <select name="feel" required className="input-field" defaultValue="">
              <option value="" disabled>
                How good?
              </option>
              {SCORE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                  {n === 1 ? " · awful" : n === 10 ? " · great" : ""}
                </option>
              ))}
            </select>
          </div>
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

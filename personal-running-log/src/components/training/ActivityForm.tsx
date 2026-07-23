"use client";

import type { ActivityTag, ActivityType } from "@prisma/client";
import { useState, useTransition } from "react";
import { createActivity } from "app/actions/activities";
import { parseMinSec, kmToMiles } from "lib/training/format";
import { usePreferences } from "lib/preferences";
import { ACTIVITY_TAG_OPTIONS } from "lib/training/tags";

type ActivityFormProps = {
  dateKey: string;
  onSuccess?: () => void;
};

const SCORE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

const compactInput =
  "w-14 rounded-md border border-ink-200 bg-white px-2 py-1.5 text-center text-sm text-ink-900 outline-none focus:border-brand-500";

function DistanceOrTimeFields({
  prefix,
  unit,
}: {
  prefix: string;
  unit: "mi" | "km";
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="label-field">
          Distance ({unit === "km" ? "km" : "mi"})
        </label>
        <input
          name={`${prefix}_distance`}
          type="number"
          step="0.1"
          min="0"
          className="input-field"
          placeholder={unit === "km" ? "3.2" : "2.0"}
        />
      </div>
      <div>
        <label className="label-field">Time</label>
        <div className="flex items-center gap-1">
          <input
            name={`${prefix}_duration_min`}
            type="number"
            min="0"
            step="1"
            className={compactInput}
            placeholder="10"
            aria-label={`${prefix} minutes`}
          />
          <span className="text-xs text-ink-500">min</span>
          <input
            name={`${prefix}_duration_sec`}
            type="number"
            min="0"
            max="59"
            step="1"
            className={compactInput}
            placeholder="00"
            aria-label={`${prefix} seconds`}
          />
          <span className="text-xs text-ink-500">sec</span>
        </div>
      </div>
    </div>
  );
}

export default function ActivityForm({ dateKey, onSuccess }: ActivityFormProps) {
  const { unit } = usePreferences();
  const [type, setType] = useState<ActivityType>("RUN");
  const [planned, setPlanned] = useState(false);
  const [tags, setTags] = useState<ActivityTag[]>([]);
  const [includeWu, setIncludeWu] = useState(false);
  const [includeCd, setIncludeCd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleTag(tag: ActivityTag) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function toMiles(raw: FormDataEntryValue | null): number | null {
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return unit === "km" ? kmToMiles(n) : n;
  }

  function toPaceSeconds(
    formData: FormData,
    minKey: string,
    secKey: string
  ): number | null {
    let pace = parseMinSec(
      formData.get(minKey) as string,
      formData.get(secKey) as string
    );
    if (pace != null && unit === "km") {
      pace = Math.round(pace * 1.60934);
    }
    return pace;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name");
    const notes = formData.get("notes");
    const difficulty = formData.get("difficulty");
    const feel = formData.get("feel");

    startTransition(async () => {
      try {
        if (type === "RUN") {
          const mainDistance = toMiles(formData.get("main_distance"));
          const mainDuration = parseMinSec(
            formData.get("main_duration_min") as string,
            formData.get("main_duration_sec") as string
          );
          const mainPace = toPaceSeconds(
            formData,
            "main_pace_min",
            "main_pace_sec"
          );
          const mainNotes = formData.get("main_notes");

          const segments: {
            kind: "WU" | "MAIN" | "CD";
            distance_miles?: number | null;
            duration_seconds?: number | null;
            pace_seconds?: number | null;
            notes?: string | null;
          }[] = [
            {
              kind: "MAIN",
              distance_miles: mainDistance,
              duration_seconds: mainDuration,
              pace_seconds: mainPace,
              notes: typeof mainNotes === "string" ? mainNotes : null,
            },
          ];

          if (includeWu) {
            segments.unshift({
              kind: "WU",
              distance_miles: toMiles(formData.get("wu_distance")),
              duration_seconds: parseMinSec(
                formData.get("wu_duration_min") as string,
                formData.get("wu_duration_sec") as string
              ),
            });
          }
          if (includeCd) {
            segments.push({
              kind: "CD",
              distance_miles: toMiles(formData.get("cd_distance")),
              duration_seconds: parseMinSec(
                formData.get("cd_duration_min") as string,
                formData.get("cd_duration_sec") as string
              ),
            });
          }

          await createActivity({
            date: dateKey,
            type,
            name: typeof name === "string" ? name : null,
            planned,
            tags,
            segments,
            difficulty: difficulty ? Number(difficulty) : null,
            feel: feel ? Number(feel) : null,
            notes: typeof notes === "string" ? notes : null,
          });
        } else {
          const duration_seconds = parseMinSec(
            formData.get("duration_min") as string,
            formData.get("duration_sec") as string
          );
          await createActivity({
            date: dateKey,
            type,
            name: typeof name === "string" ? name : null,
            planned,
            tags,
            duration_seconds,
            difficulty: difficulty ? Number(difficulty) : null,
            feel: feel ? Number(feel) : null,
            notes: typeof notes === "string" ? notes : null,
          });
        }

        form.reset();
        setType("RUN");
        setPlanned(false);
        setTags([]);
        setIncludeWu(false);
        setIncludeCd(false);
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save activity.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-4 pb-2">
      <div className="rounded-lg border border-ink-100 bg-white p-3">
        <label className="label-field">Name</label>
        <input
          name="name"
          type="text"
          className="input-field"
          placeholder="Easy aerobic · Tempo · Long run"
        />
        <div className="mt-3 grid grid-cols-2 gap-3">
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
      </div>

      <div className="rounded-lg border border-ink-100 bg-white p-3">
        <label className="label-field">Tags</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {ACTIVITY_TAG_OPTIONS.map((opt) => {
            const on = tags.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleTag(opt.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  on ? opt.onClass : opt.offClass
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-ink-500">
          Multi-select OK — e.g. Long + Workout.
        </p>
      </div>

      {type === "RUN" && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIncludeWu((v) => !v)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                includeWu
                  ? "bg-sky-600 text-white"
                  : "border border-sky-600 bg-sky-50 text-sky-700"
              }`}
            >
              {includeWu ? "✓ Warm-up" : "+ Warm-up"}
            </button>
            <button
              type="button"
              onClick={() => setIncludeCd((v) => !v)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                includeCd
                  ? "bg-trail-600 text-white"
                  : "border border-trail-600 bg-trail-50 text-trail-700"
              }`}
            >
              {includeCd ? "✓ Cool-down" : "+ Cool-down"}
            </button>
          </div>

          {includeWu && (
            <div className="space-y-2 rounded-lg border border-sky-100 bg-sky-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
                Warm-up
              </p>
              <p className="text-xs text-sky-700">
                Enter distance and/or time (e.g. 2 mi or 10 min).
              </p>
              <DistanceOrTimeFields prefix="wu" unit={unit} />
            </div>
          )}

          <div className="space-y-3 rounded-lg border border-ink-200 border-l-4 border-l-brand-500 bg-white p-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-700">
                Main set
              </p>
              <p className="mt-0.5 text-xs text-ink-500">
                Distance and/or time, plus pace if you have it.
              </p>
            </div>
            <DistanceOrTimeFields prefix="main" unit={unit} />
            <div>
              <label className="label-field">
                Pace (min / {unit === "km" ? "km" : "mi"})
              </label>
              <div className="flex items-center gap-1">
                <input
                  name="main_pace_min"
                  type="number"
                  min="0"
                  step="1"
                  className={compactInput}
                  placeholder="5"
                  aria-label="Main pace minutes"
                />
                <span className="text-sm font-medium text-ink-500">:</span>
                <input
                  name="main_pace_sec"
                  type="number"
                  min="0"
                  max="59"
                  step="1"
                  className={compactInput}
                  placeholder="15"
                  aria-label="Main pace seconds"
                />
              </div>
            </div>
            <div>
              <label className="label-field">Main set notes</label>
              <input
                name="main_notes"
                type="text"
                className="input-field"
                placeholder="8×1k @ 3:10, 90s jog"
              />
            </div>
          </div>

          {includeCd && (
            <div className="space-y-2 rounded-lg border border-trail-100 bg-trail-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-trail-700">
                Cool-down
              </p>
              <p className="text-xs text-trail-700">
                Enter distance and/or time (e.g. 2 mi or 10 min).
              </p>
              <DistanceOrTimeFields prefix="cd" unit={unit} />
            </div>
          )}
        </>
      )}

      {(type === "BIKE" || type === "XTRAIN") && (
        <div className="rounded-lg border border-ink-200 border-l-4 border-l-brand-500 bg-white p-3">
          <label className="label-field">Time</label>
          <div className="mt-1 flex items-center gap-1">
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
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-gold-100 bg-gold-50 p-3">
          <div>
            <label className="label-field text-gold-700">Difficulty (1–10)</label>
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
            <label className="label-field text-gold-700">Feel (1–10)</label>
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
          placeholder="Optional overall notes"
        />
      </div>

      {error && (
        <p className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-700">
          {error}
        </p>
      )}

      <div className="border-t border-ink-100 pt-3">
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending
            ? "Saving…"
            : planned
              ? "Add planned workout"
              : "Log activity"}
        </button>
      </div>
    </form>
  );
}

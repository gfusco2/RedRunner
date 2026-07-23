"use client";

import type { ActivityTag, ActivityType } from "@prisma/client";
import { useState, useTransition } from "react";
import { createActivity } from "app/actions/activities";
import { parseMinSec, kmToMiles } from "lib/training/format";
import { usePreferences } from "lib/preferences";
import { ACTIVITY_TAG_OPTIONS } from "lib/training/tags";

type Props = {
  dateKey: string;
  athleteId: string;
  onSuccess?: () => void;
};

const compactInput =
  "w-14 rounded-md border border-ink-200 bg-white px-2 py-1.5 text-center text-sm text-ink-900 outline-none focus:border-brand-500";

export default function PrescribeWorkoutForm({
  dateKey,
  athleteId,
  onSuccess,
}: Props) {
  const { unit } = usePreferences();
  const [type, setType] = useState<ActivityType>("RUN");
  const [tags, setTags] = useState<ActivityTag[]>(["WORKOUT"]);
  const [includeWu, setIncludeWu] = useState(true);
  const [includeCd, setIncludeCd] = useState(true);
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

  function toPaceSeconds(formData: FormData): number | null {
    let pace = parseMinSec(
      formData.get("main_pace_min") as string,
      formData.get("main_pace_sec") as string
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

    startTransition(async () => {
      try {
        if (type === "RUN") {
          const segments: {
            kind: "WU" | "MAIN" | "CD";
            distance_miles?: number | null;
            duration_seconds?: number | null;
            pace_seconds?: number | null;
            notes?: string | null;
          }[] = [
            {
              kind: "MAIN",
              distance_miles: toMiles(formData.get("main_distance")),
              duration_seconds: parseMinSec(
                formData.get("main_duration_min") as string,
                formData.get("main_duration_sec") as string
              ),
              pace_seconds: toPaceSeconds(formData),
              notes: (formData.get("main_notes") as string) || null,
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
            type: "RUN",
            athleteId,
            planned: true,
            name: typeof name === "string" ? name : null,
            tags,
            segments,
            notes: typeof notes === "string" ? notes : null,
          });
        } else {
          await createActivity({
            date: dateKey,
            type,
            athleteId,
            planned: true,
            name: typeof name === "string" ? name : null,
            tags,
            duration_seconds: parseMinSec(
              formData.get("duration_min") as string,
              formData.get("duration_sec") as string
            ),
            notes: typeof notes === "string" ? notes : null,
          });
        }
        form.reset();
        setTags(["WORKOUT"]);
        setIncludeWu(true);
        setIncludeCd(true);
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not prescribe.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label-field">Workout name</label>
        <input
          name="name"
          className="input-field"
          placeholder="1k repeats · Tempo · Long run"
          required
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
          <label className="label-field">Tags</label>
          <div className="flex flex-wrap gap-1">
            {ACTIVITY_TAG_OPTIONS.map((opt) => {
              const on = tags.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleTag(opt.value)}
                  className={`rounded px-2 py-1 text-[10px] font-semibold ${
                    on ? opt.onClass : opt.offClass
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {type === "RUN" && (
        <>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIncludeWu((v) => !v)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                includeWu
                  ? "bg-sky-600 text-white"
                  : "border border-sky-600 bg-sky-50 text-sky-700"
              }`}
            >
              {includeWu ? "✓ WU" : "+ WU"}
            </button>
            <button
              type="button"
              onClick={() => setIncludeCd((v) => !v)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                includeCd
                  ? "bg-trail-600 text-white"
                  : "border border-trail-600 bg-trail-50 text-trail-700"
              }`}
            >
              {includeCd ? "✓ CD" : "+ CD"}
            </button>
          </div>

          {includeWu && (
            <div className="rounded-md border border-sky-100 bg-sky-50 p-2.5 space-y-2">
              <p className="text-xs font-semibold text-sky-700">Warm-up</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="wu_distance"
                  type="number"
                  step="0.1"
                  min="0"
                  className="input-field"
                  placeholder={`Distance (${unit})`}
                />
                <div className="flex items-center gap-1">
                  <input
                    name="wu_duration_min"
                    type="number"
                    min="0"
                    className={compactInput}
                    placeholder="10"
                  />
                  <span className="text-xs text-ink-500">min</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 rounded-md border border-ink-200 border-l-4 border-l-brand-500 bg-white p-2.5">
            <p className="text-xs font-semibold text-ink-700">Main set</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                name="main_distance"
                type="number"
                step="0.1"
                min="0"
                className="input-field"
                placeholder={`Distance (${unit})`}
              />
              <div className="flex items-center gap-1">
                <input
                  name="main_duration_min"
                  type="number"
                  min="0"
                  className={compactInput}
                  placeholder="0"
                />
                <span className="text-xs text-ink-500">min</span>
                <input
                  name="main_duration_sec"
                  type="number"
                  min="0"
                  max="59"
                  className={compactInput}
                  placeholder="00"
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-ink-500">Pace</span>
              <input
                name="main_pace_min"
                type="number"
                min="0"
                className={compactInput}
                placeholder="5"
              />
              <span>:</span>
              <input
                name="main_pace_sec"
                type="number"
                min="0"
                max="59"
                className={compactInput}
                placeholder="15"
              />
            </div>
            <input
              name="main_notes"
              className="input-field"
              placeholder="8×1k @ 3:10, 90s jog"
            />
          </div>

          {includeCd && (
            <div className="rounded-md border border-trail-100 bg-trail-50 p-2.5 space-y-2">
              <p className="text-xs font-semibold text-trail-700">Cool-down</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="cd_distance"
                  type="number"
                  step="0.1"
                  min="0"
                  className="input-field"
                  placeholder={`Distance (${unit})`}
                />
                <div className="flex items-center gap-1">
                  <input
                    name="cd_duration_min"
                    type="number"
                    min="0"
                    className={compactInput}
                    placeholder="10"
                  />
                  <span className="text-xs text-ink-500">min</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {type !== "RUN" && (
        <div className="flex items-center gap-1">
          <input
            name="duration_min"
            type="number"
            min="0"
            required
            className={compactInput}
            placeholder="45"
          />
          <span className="text-xs text-ink-500">min</span>
        </div>
      )}

      <div>
        <label className="label-field">Coach notes</label>
        <textarea
          name="notes"
          rows={2}
          className="input-field"
          placeholder="Leave ≥1 easy day before long · strides day before"
        />
      </div>

      {error && <p className="text-sm text-brand-600">{error}</p>}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Saving…" : "Prescribe to athlete"}
      </button>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import type { ActivityWithDetails } from "app/actions/activities";
import { markActivityCompleted } from "app/actions/activities";
import {
  formatDistance,
  formatMinSec,
  formatPaceDisplay,
  kmToMiles,
  parseMinSec,
} from "lib/training/format";
import { usePreferences } from "lib/preferences";
import { SEGMENT_KIND_SHORT } from "lib/training/tags";

type Props = {
  activity: ActivityWithDetails;
  onDone: () => void;
  onCancel: () => void;
};

type SplitRow = {
  key: string;
  label: string;
  dist: string;
  min: string;
  sec: string;
  restSec: string;
};

const SCORE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

const compact =
  "w-14 rounded-md border border-ink-200 bg-white px-2 py-1.5 text-center text-sm text-ink-900 outline-none focus:border-brand-500";

function milesDisplay(
  miles: number | null | undefined,
  unit: "mi" | "km"
): string {
  if (miles == null || miles <= 0) return "";
  if (unit === "km") return (miles * 1.60934).toFixed(2);
  return String(Number(miles.toFixed(2)));
}

function secParts(total: number | null | undefined): { min: string; sec: string } {
  if (total == null || total <= 0) return { min: "", sec: "" };
  return {
    min: String(Math.floor(total / 60)),
    sec: String(Math.round(total % 60)).padStart(2, "0"),
  };
}

export default function CompleteWorkoutForm({
  activity,
  onDone,
  onCancel,
}: Props) {
  const { unit } = usePreferences();
  const unitLabel = unit === "km" ? "km" : "mi";
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const main = activity.segments.find((s) => s.kind === "MAIN");
  const wu = activity.segments.find((s) => s.kind === "WU");
  const cd = activity.segments.find((s) => s.kind === "CD");

  const [name, setName] = useState(activity.name ?? "");
  const [notes, setNotes] = useState("");
  const [includeWu, setIncludeWu] = useState(Boolean(wu));
  const [includeCd, setIncludeCd] = useState(Boolean(cd));
  const [wuDist, setWuDist] = useState(milesDisplay(wu?.distance_miles, unit));
  const [mainDist, setMainDist] = useState(
    milesDisplay(main?.distance_miles, unit)
  );
  const [cdDist, setCdDist] = useState(milesDisplay(cd?.distance_miles, unit));
  const mainPace = secParts(main?.pace_seconds);
  const [paceMin, setPaceMin] = useState(mainPace.min);
  const [paceSec, setPaceSec] = useState(mainPace.sec);
  const [splits, setSplits] = useState<SplitRow[]>([]);

  function toMiles(raw: string): number | null {
    if (!raw.trim()) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return unit === "km" ? kmToMiles(n) : n;
  }

  function addSplit() {
    setSplits((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${prev.length}`,
        label: `Rep ${prev.length + 1}`,
        dist: "",
        min: "",
        sec: "",
        restSec: "",
      },
    ]);
  }

  function updateSplit(key: string, patch: Partial<SplitRow>) {
    setSplits((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  function removeSplit(key: string) {
    setSplits((prev) => prev.filter((row) => row.key !== key));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const difficulty = Number(form.get("difficulty"));
    const feel = Number(form.get("feel"));

    startTransition(async () => {
      try {
        let pace = parseMinSec(paceMin, paceSec);
        if (pace != null && unit === "km") {
          pace = Math.round(pace * 1.60934);
        }

        const segments =
          activity.type === "RUN"
            ? [
                ...(includeWu
                  ? [
                      {
                        kind: "WU" as const,
                        distance_miles: toMiles(wuDist),
                        duration_seconds: null,
                      },
                    ]
                  : []),
                {
                  kind: "MAIN" as const,
                  distance_miles: toMiles(mainDist),
                  pace_seconds: pace,
                  notes: main?.notes ?? null,
                },
                ...(includeCd
                  ? [
                      {
                        kind: "CD" as const,
                        distance_miles: toMiles(cdDist),
                        duration_seconds: null,
                      },
                    ]
                  : []),
              ]
            : undefined;

        const splitInputs = splits.map((row) => ({
          label: row.label || null,
          distance_miles: toMiles(row.dist),
          duration_seconds: parseMinSec(row.min, row.sec),
          rest_seconds: row.restSec.trim()
            ? Math.round(Number(row.restSec))
            : null,
        }));

        await markActivityCompleted(activity.id, {
          difficulty,
          feel,
          name: name.trim() || null,
          notes: notes.trim() || null,
          segments,
          splits: splitInputs,
        });
        onDone();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not complete workout."
        );
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-3 rounded-lg border border-brand-200 bg-brand-50 p-3"
    >
      <div>
        <p className="text-xs font-semibold text-brand-800">
          Log what you actually did
        </p>
        <p className="mt-0.5 text-[11px] text-brand-700">
          The plan is a guide — adjust distances, add notes, and record splits.
        </p>
      </div>

      {activity.segments.length > 0 && (
        <div className="rounded-md border border-brand-100 bg-white px-2.5 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
            Prescribed
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-ink-600">
            {activity.segments.map((seg) => {
              const bits: string[] = [SEGMENT_KIND_SHORT[seg.kind]];
              if (seg.distance_miles != null) {
                bits.push(formatDistance(seg.distance_miles, unit));
              }
              if (seg.duration_seconds != null) {
                bits.push(formatMinSec(seg.duration_seconds));
              }
              const p = formatPaceDisplay(seg.pace_seconds, unit);
              if (p) bits.push(p);
              return (
                <li key={seg.id}>
                  {bits.join(" · ")}
                  {seg.notes ? ` — ${seg.notes}` : ""}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div>
        <label className="label-field">Name</label>
        <input
          className="input-field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workout name"
        />
      </div>

      {activity.type === "RUN" && (
        <div className="space-y-2 rounded-md border border-ink-100 bg-white p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
            Actual segments ({unitLabel})
          </p>
          <label className="flex items-center gap-2 text-xs text-ink-700">
            <input
              type="checkbox"
              checked={includeWu}
              onChange={(e) => setIncludeWu(e.target.checked)}
            />
            Warm-up
            {includeWu && (
              <input
                className={compact}
                value={wuDist}
                onChange={(e) => setWuDist(e.target.value)}
                placeholder="2"
                inputMode="decimal"
              />
            )}
          </label>
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-700">
            <span className="font-semibold text-brand-700">Main</span>
            <input
              className={compact}
              value={mainDist}
              onChange={(e) => setMainDist(e.target.value)}
              placeholder="5"
              inputMode="decimal"
              required
            />
            <span className="text-ink-400">pace</span>
            <input
              className={compact}
              value={paceMin}
              onChange={(e) => setPaceMin(e.target.value)}
              placeholder="m"
              inputMode="numeric"
            />
            <span>:</span>
            <input
              className={compact}
              value={paceSec}
              onChange={(e) => setPaceSec(e.target.value)}
              placeholder="ss"
              inputMode="numeric"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-ink-700">
            <input
              type="checkbox"
              checked={includeCd}
              onChange={(e) => setIncludeCd(e.target.checked)}
            />
            Cool-down
            {includeCd && (
              <input
                className={compact}
                value={cdDist}
                onChange={(e) => setCdDist(e.target.value)}
                placeholder="1"
                inputMode="decimal"
              />
            )}
          </label>
        </div>
      )}

      <div>
        <label className="label-field">Result notes</label>
        <textarea
          rows={3}
          className="input-field"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder='e.g. Did 6×800m instead with 60s standing rest'
        />
      </div>

      <div className="rounded-md border border-ink-100 bg-white p-2.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
            Splits / reps
          </p>
          <button
            type="button"
            onClick={addSplit}
            className="text-xs font-semibold text-brand-600 hover:text-brand-800"
          >
            + Add split
          </button>
        </div>
        {splits.length === 0 ? (
          <p className="text-[11px] text-ink-400">
            Optional — add each rep time (and rest) for the main set.
          </p>
        ) : (
          <ul className="space-y-2">
            {splits.map((row) => (
              <li
                key={row.key}
                className="flex flex-wrap items-center gap-1.5 text-xs"
              >
                <input
                  className="w-16 rounded-md border border-ink-200 px-1.5 py-1"
                  value={row.label}
                  onChange={(e) =>
                    updateSplit(row.key, { label: e.target.value })
                  }
                  placeholder="Rep"
                />
                <input
                  className={compact}
                  value={row.dist}
                  onChange={(e) =>
                    updateSplit(row.key, { dist: e.target.value })
                  }
                  placeholder={unitLabel}
                  inputMode="decimal"
                />
                <input
                  className={compact}
                  value={row.min}
                  onChange={(e) =>
                    updateSplit(row.key, { min: e.target.value })
                  }
                  placeholder="m"
                  inputMode="numeric"
                />
                <span>:</span>
                <input
                  className={compact}
                  value={row.sec}
                  onChange={(e) =>
                    updateSplit(row.key, { sec: e.target.value })
                  }
                  placeholder="ss"
                  inputMode="numeric"
                />
                <span className="text-ink-400">rest s</span>
                <input
                  className={compact}
                  value={row.restSec}
                  onChange={(e) =>
                    updateSplit(row.key, { restSec: e.target.value })
                  }
                  placeholder="60"
                  inputMode="numeric"
                />
                <button
                  type="button"
                  onClick={() => removeSplit(row.key)}
                  className="text-ink-400 hover:text-brand-700"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

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
          <select name="feel" required className="input-field" defaultValue="">
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

      {error && <p className="text-xs text-brand-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary flex-1">
          {pending ? "Saving…" : "Save as completed"}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

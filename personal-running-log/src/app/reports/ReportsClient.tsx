"use client";

import { useMemo, useState, useTransition } from "react";
import type { ActivityWithDetails } from "app/actions/activities";
import { getActivitiesInRange } from "app/actions/activities";
import {
  formatDistance,
  formatMinSec,
  formatPaceDisplay,
} from "lib/training/format";
import { usePreferences } from "lib/preferences";
import { TAG_LABELS } from "lib/training/tags";
import { toDateKey, parseDateKey, addWeeks, getMonday, localTodayKey } from "lib/training/dates";

function defaultRange() {
  const todayKey = localTodayKey();
  const end = parseDateKey(todayKey);
  const start = addWeeks(getMonday(end), -3);
  return { start: toDateKey(start), end: todayKey };
}

export default function ReportsClient() {
  const defaults = useMemo(() => defaultRange(), []);
  const { unit } = usePreferences();
  const [start, setStart] = useState(defaults.start);
  const [end, setEnd] = useState(defaults.end);
  const [activities, setActivities] = useState<ActivityWithDetails[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function load() {
    setError(null);
    startTransition(async () => {
      try {
        // end is inclusive in UI → exclusive for query
        const endExclusive = toDateKey(
          new Date(parseDateKey(end).getTime() + 24 * 60 * 60 * 1000)
        );
        const rows = await getActivitiesInRange(start, endExclusive);
        setActivities(rows);
        setLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load.");
      }
    });
  }

  function downloadCsv() {
    const header = [
      "date",
      "type",
      "name",
      "planned",
      "tags",
      "distance_miles",
      "duration_seconds",
      "pace_seconds",
      "difficulty",
      "feel",
      "notes",
      "segments",
    ];
    const lines = activities.map((a) => {
      const segs = a.segments
        .map((s) => {
          const bits: string[] = [s.kind];
          if (s.distance_miles != null) bits.push(`${s.distance_miles}mi`);
          if (s.duration_seconds != null) bits.push(`${s.duration_seconds}s`);
          if (s.notes) bits.push(s.notes);
          return bits.join(" ");
        })
        .join(" | ");
      return [
        toDateKey(new Date(a.date)),
        a.type,
        JSON.stringify(a.name ?? ""),
        a.planned ? "1" : "0",
        a.tags.join(";"),
        a.distance_miles ?? "",
        a.duration_seconds ?? "",
        a.pace_seconds ?? "",
        a.difficulty ?? "",
        a.feel ?? "",
        JSON.stringify(a.notes ?? ""),
        JSON.stringify(segs),
      ].join(",");
    });
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `redrunner-${start}-to-${end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const completedMiles = activities
    .filter((a) => a.type === "RUN" && !a.planned && a.distance_miles)
    .reduce((sum, a) => sum + (a.distance_miles ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-soft print:hidden">
        <h2 className="text-lg font-semibold text-ink-900">Date range</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label-field">Start</label>
            <input
              type="date"
              className="input-field"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div>
            <label className="label-field">End</label>
            <input
              type="date"
              className="input-field"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="btn-primary w-full"
              disabled={pending}
              onClick={load}
            >
              {pending ? "Loading…" : "Load report"}
            </button>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-brand-600">{error}</p>}
      </div>

      {loaded && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <p className="text-sm text-ink-500">
              {activities.length} activities ·{" "}
              {formatDistance(completedMiles, unit)} completed run
            </p>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost" onClick={downloadCsv}>
                Download CSV
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => window.print()}
              >
                Print / PDF
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-ink-100 bg-white p-6 shadow-soft print:border-0 print:shadow-none">
            <div className="mb-6 border-b border-ink-100 pb-4">
              <h1 className="text-2xl font-semibold text-ink-900">
                Red<span className="text-brand-600">Runner</span> report
              </h1>
              <p className="mt-1 text-sm text-ink-500">
                {start} → {end} · {formatDistance(completedMiles, unit)}{" "}
                completed
              </p>
            </div>

            {activities.length === 0 ? (
              <p className="text-sm text-ink-500">No activities in this range.</p>
            ) : (
              <ul className="space-y-4">
                {activities.map((a) => (
                  <li
                    key={a.id}
                    className="border-b border-ink-100 pb-3 last:border-0"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold text-ink-900">
                        {toDateKey(new Date(a.date))} ·{" "}
                        {a.name?.trim() || a.type}
                        {a.planned ? " (planned)" : ""}
                      </p>
                      <p className="text-sm text-brand-700">
                        {a.type === "RUN" && a.distance_miles != null
                          ? formatDistance(a.distance_miles, unit)
                          : a.duration_seconds != null
                            ? formatMinSec(a.duration_seconds)
                            : ""}
                        {a.pace_seconds
                          ? ` · ${formatPaceDisplay(a.pace_seconds, unit)}`
                          : ""}
                      </p>
                    </div>
                    {a.tags.length > 0 && (
                      <p className="mt-1 text-xs text-ink-500">
                        {a.tags.map((t) => TAG_LABELS[t]).join(" · ")}
                      </p>
                    )}
                    {a.segments.length > 0 && (
                      <ul className="mt-1 text-xs text-ink-500">
                        {a.segments.map((s) => (
                          <li key={s.id}>
                            {s.kind}
                            {s.distance_miles != null
                              ? ` · ${formatDistance(s.distance_miles, unit)}`
                              : ""}
                            {s.duration_seconds != null
                              ? ` · ${formatMinSec(s.duration_seconds)}`
                              : ""}
                            {s.notes ? ` — ${s.notes}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                    {a.notes && (
                      <p className="mt-1 text-xs text-ink-500">{a.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { usePreferences } from "lib/preferences";
import type { DistanceUnit } from "lib/training/format";

export default function UnitPreferenceForm() {
  const { unit, setUnit } = usePreferences();

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-ink-900">Distance units</h2>
      <p className="mt-1 text-sm text-ink-500">
        Choose how distances and pace are labeled across the app. Stored values
        stay in miles under the hood.
      </p>
      <div className="mt-4 flex gap-2">
        {(
          [
            { value: "mi", label: "Miles" },
            { value: "km", label: "Kilometers" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setUnit(opt.value as DistanceUnit)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              unit === opt.value
                ? "bg-brand-600 text-white"
                : "border border-ink-200 bg-white text-ink-700 hover:border-brand-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

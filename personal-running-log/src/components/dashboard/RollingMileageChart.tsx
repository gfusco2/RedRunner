"use client";

import { formatDistance } from "lib/training/format";
import { usePreferences } from "lib/preferences";
import type { RollingPoint } from "lib/training/analytics";

export type ChartGoalBand = {
  dateKey: string;
  low: number;
  high: number;
  goal: number;
};

type Props = {
  points: RollingPoint[];
  /** Per-day goal band (aligned to each rolling point's date). */
  goalBands?: ChartGoalBand[];
  title?: string;
};

export default function RollingMileageChart({
  points,
  goalBands = [],
  title = "Rolling 7-day run mileage",
}: Props) {
  const { unit } = usePreferences();
  const bandByDay = new Map(goalBands.map((b) => [b.dateKey, b]));
  const max = Math.max(
    ...points.map((p) => p.miles),
    ...goalBands.map((b) => b.high),
    0.1
  );
  const latest = points[points.length - 1];

  // Keep the line readable — sample denser than bars (~1 point every ~2 days max)
  const step = Math.max(1, Math.floor(points.length / 72));
  const sampled = points.filter(
    (_, i) => i % step === 0 || i === points.length - 1
  );

  const w = 560;
  const h = 168;
  const padX = 10;
  const padY = 14;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  function xAt(i: number) {
    if (sampled.length <= 1) return padX + chartW / 2;
    return padX + (i / (sampled.length - 1)) * chartW;
  }

  function yAt(miles: number) {
    return padY + chartH - (miles / max) * chartH;
  }

  const withBand = sampled
    .map((p, i) => ({ p, i, band: bandByDay.get(p.dateKey) }))
    .filter((x): x is { p: RollingPoint; i: number; band: ChartGoalBand } =>
      Boolean(x.band)
    );

  let bandPath = "";
  if (withBand.length >= 2) {
    const top = withBand
      .map(({ i, band }) => `${xAt(i)},${yAt(band.high)}`)
      .join(" L ");
    const bottom = [...withBand]
      .reverse()
      .map(({ i, band }) => `${xAt(i)},${yAt(band.low)}`)
      .join(" L ");
    bandPath = `M ${top} L ${bottom} Z`;
  }

  const goalLine =
    withBand.length >= 2
      ? withBand
          .map(
            ({ i, band }, idx) =>
              `${idx === 0 ? "M" : "L"} ${xAt(i)},${yAt(band.goal)}`
          )
          .join(" ")
      : "";

  const mileageLine = sampled
    .map(
      (p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)},${yAt(p.miles).toFixed(1)}`
    )
    .join(" ");

  // Soft fill under the mileage line
  const areaPath =
    sampled.length >= 2
      ? `${mileageLine} L ${xAt(sampled.length - 1)},${padY + chartH} L ${xAt(0)},${padY + chartH} Z`
      : "";

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
          <p className="text-xs text-ink-500">
            Completed run miles · shaded band = weekly goal ± range
          </p>
        </div>
        {latest && (
          <p className="text-right">
            <span className="block text-xs uppercase tracking-wide text-ink-500">
              Current
            </span>
            <span className="text-xl font-semibold text-brand-700">
              {formatDistance(latest.miles, unit)}
            </span>
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="h-44 w-full min-w-[320px]"
          role="img"
          aria-label={title}
        >
          {bandPath && (
            <path d={bandPath} fill="#fecaca" fillOpacity="0.5" stroke="none" />
          )}
          {goalLine && (
            <path
              d={goalLine}
              fill="none"
              stroke="#b91c1c"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              opacity="0.65"
            />
          )}
          {areaPath && (
            <path d={areaPath} fill="#fca5a5" fillOpacity="0.25" stroke="none" />
          )}
          <line
            x1={padX}
            y1={padY + chartH}
            x2={padX + chartW}
            y2={padY + chartH}
            stroke="#d9d9de"
            strokeWidth="1"
          />
          <path
            d={mileageLine}
            fill="none"
            stroke="#dc2626"
            strokeWidth="2.25"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {sampled.map((p, i) => {
            const band = bandByDay.get(p.dateKey);
            const isLast = i === sampled.length - 1;
            return (
              <circle
                key={p.dateKey}
                cx={xAt(i)}
                cy={yAt(p.miles)}
                r={isLast ? 3.5 : 2}
                fill={isLast ? "#b91c1c" : "#dc2626"}
              >
                <title>{`${p.dateKey}: ${formatDistance(p.miles, unit)}${
                  band
                    ? ` · goal ${formatDistance(band.goal, unit)} (${formatDistance(band.low, unit)}–${formatDistance(band.high, unit)})`
                    : ""
                }`}</title>
              </circle>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

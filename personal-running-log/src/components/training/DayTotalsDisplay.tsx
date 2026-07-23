import type { DayTotals } from "lib/training/totals";
import { hasAnyTotals } from "lib/training/totals";
import { formatDuration, formatMiles } from "lib/training/format";

type DayTotalsDisplayProps = {
  totals: DayTotals;
  compact?: boolean;
};

export default function DayTotalsDisplay({
  totals,
  compact = false,
}: DayTotalsDisplayProps) {
  if (!hasAnyTotals(totals)) {
    return (
      <p className={`text-ink-200 ${compact ? "text-xs" : "text-sm"}`}>—</p>
    );
  }

  const text = compact ? "text-xs" : "text-sm";

  return (
    <ul className={`space-y-0.5 ${text}`}>
      {totals.runMiles > 0 && (
        <li className="text-brand-700">
          <span className="font-medium">Run</span> {formatMiles(totals.runMiles)}
        </li>
      )}
      {totals.plannedRunMiles > 0 && (
        <li className="text-brand-400">
          <span className="font-medium">Plan</span>{" "}
          {formatMiles(totals.plannedRunMiles)}
        </li>
      )}
      {totals.bikeSeconds > 0 && (
        <li className="text-ink-700">
          <span className="font-medium">Bike</span>{" "}
          {formatDuration(totals.bikeSeconds)}
        </li>
      )}
      {totals.plannedBikeSeconds > 0 && (
        <li className="text-ink-500">
          <span className="font-medium">Bike plan</span>{" "}
          {formatDuration(totals.plannedBikeSeconds)}
        </li>
      )}
      {totals.xtrainSeconds > 0 && (
        <li className="text-ink-700">
          <span className="font-medium">X-Train</span>{" "}
          {formatDuration(totals.xtrainSeconds)}
        </li>
      )}
      {totals.plannedXtrainSeconds > 0 && (
        <li className="text-ink-500">
          <span className="font-medium">X-Train plan</span>{" "}
          {formatDuration(totals.plannedXtrainSeconds)}
        </li>
      )}
    </ul>
  );
}

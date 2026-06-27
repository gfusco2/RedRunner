import type { DayTotals } from "lib/training/totals";
import { formatDuration, formatMiles } from "lib/training/format";

type DayTotalsDisplayProps = {
  totals: DayTotals;
  compact?: boolean;
};

export default function DayTotalsDisplay({
  totals,
  compact = false,
}: DayTotalsDisplayProps) {
  const hasActivity =
    totals.runMiles > 0 || totals.bikeSeconds > 0 || totals.xtrainSeconds > 0;

  if (!hasActivity) {
    return (
      <p className={`text-gray-400 ${compact ? "text-xs" : "text-sm"}`}>—</p>
    );
  }

  return (
    <ul className={`space-y-0.5 ${compact ? "text-xs" : "text-sm"}`}>
      {totals.runMiles > 0 && (
        <li className="text-blue-700">
          <span className="font-medium">Run</span> {formatMiles(totals.runMiles)}
        </li>
      )}
      {totals.bikeSeconds > 0 && (
        <li className="text-green-700">
          <span className="font-medium">Bike</span>{" "}
          {formatDuration(totals.bikeSeconds)}
        </li>
      )}
      {totals.xtrainSeconds > 0 && (
        <li className="text-purple-700">
          <span className="font-medium">X-Train</span>{" "}
          {formatDuration(totals.xtrainSeconds)}
        </li>
      )}
    </ul>
  );
}

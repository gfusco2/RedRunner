export type DistanceUnit = "mi" | "km";

const KM_PER_MILE = 1.60934;

export function milesToKm(miles: number): number {
  return miles * KM_PER_MILE;
}

export function kmToMiles(km: number): number {
  return km / KM_PER_MILE;
}

/** Format stored miles using the user's preferred unit. */
export function formatDistance(
  miles: number,
  unit: DistanceUnit = "mi"
): string {
  if (miles === 0) return "—";
  if (unit === "km") {
    return `${milesToKm(miles).toFixed(1)} km`;
  }
  return `${miles.toFixed(1)} mi`;
}

/** @deprecated Prefer formatDistance(miles, unit) */
export function formatMiles(miles: number): string {
  return formatDistance(miles, "mi");
}

export function formatDuration(seconds: number): string {
  if (seconds === 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatDurationLong(seconds: number): string {
  if (seconds === 0) return "0 min";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} hr ${m} min`;
  return `${m} min`;
}

/** Format entered or computed pace (seconds per mile) for display. */
export function formatPaceDisplay(
  paceSecondsPerMile: number | null | undefined,
  unit: DistanceUnit = "mi"
): string | null {
  if (paceSecondsPerMile == null || paceSecondsPerMile <= 0) return null;
  const sec =
    unit === "km" ? paceSecondsPerMile / KM_PER_MILE : paceSecondsPerMile;
  const mins = Math.floor(sec / 60);
  const secs = Math.round(sec % 60);
  return `${mins}:${String(secs).padStart(2, "0")} /${unit}`;
}

/** Average pace as m:ss per mile. */
export function formatPacePerMile(
  durationSeconds: number,
  distanceMiles: number
): string | null {
  if (durationSeconds <= 0 || distanceMiles <= 0) return null;
  const secPerMile = durationSeconds / distanceMiles;
  return formatPaceDisplay(secPerMile, "mi");
}

/** Average pace as m:ss per km. */
export function formatPacePerKm(
  durationSeconds: number,
  distanceMiles: number
): string | null {
  if (durationSeconds <= 0 || distanceMiles <= 0) return null;
  const secPerMile = durationSeconds / distanceMiles;
  return formatPaceDisplay(secPerMile, "km");
}

export function formatScore(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value}/10`;
}

/** Format total seconds as m:ss (e.g. pace or duration display). */
export function formatMinSec(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || totalSeconds < 0) return "—";
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/** Parse minutes + seconds fields into total seconds. Empty → null. */
export function parseMinSec(
  minutes: string | number | null | undefined,
  seconds: string | number | null | undefined
): number | null {
  const hasMin = minutes !== "" && minutes != null;
  const hasSec = seconds !== "" && seconds != null;
  if (!hasMin && !hasSec) return null;

  const m = hasMin ? Number(minutes) : 0;
  const s = hasSec ? Number(seconds) : 0;
  if (Number.isNaN(m) || Number.isNaN(s) || m < 0 || s < 0 || s >= 60) {
    throw new Error("Enter a valid time as minutes and seconds (0–59).");
  }
  const total = Math.round(m * 60 + s);
  return total > 0 ? total : null;
}

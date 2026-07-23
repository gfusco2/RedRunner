const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Monday-start week containing the given date. */
export function getMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = d.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  d.setDate(d.getDate() + offset);
  return d;
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    return day;
  });
}

/** Four Monday-start weeks beginning at weekStart (current + 3 ahead). */
export function getFourWeekStarts(weekStart: Date): Date[] {
  return Array.from({ length: 4 }, (_, i) => addWeeks(weekStart, i));
}

export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

export function getWeekRange(weekStart: Date): { start: Date; end: Date } {
  const start = new Date(
    weekStart.getFullYear(),
    weekStart.getMonth(),
    weekStart.getDate()
  );
  const end = new Date(start.getTime() + 7 * DAY_MS);
  return { start, end };
}

/** Inclusive start through exclusive end covering N Monday-start weeks. */
export function getMultiWeekRange(
  weekStart: Date,
  weekCount: number
): { start: Date; end: Date } {
  const start = new Date(
    weekStart.getFullYear(),
    weekStart.getMonth(),
    weekStart.getDate()
  );
  const end = new Date(start.getTime() + weekCount * 7 * DAY_MS);
  return { start, end };
}

export function formatWeekLabel(weekStart: Date): string {
  const days = getWeekDays(weekStart);
  const first = days[0];
  const last = days[6];
  const sameMonth = first.getMonth() === last.getMonth();
  const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short" });
  const dayFmt = new Intl.DateTimeFormat("en-US", { day: "numeric" });
  const yearFmt = new Intl.DateTimeFormat("en-US", { year: "numeric" });

  if (sameMonth) {
    return `${monthFmt.format(first)} ${dayFmt.format(first)} – ${dayFmt.format(last)}, ${yearFmt.format(last)}`;
  }

  return `${monthFmt.format(first)} ${dayFmt.format(first)} – ${monthFmt.format(last)} ${dayFmt.format(last)}, ${yearFmt.format(last)}`;
}

export function formatRangeLabel(start: Date, endExclusive: Date): string {
  const last = new Date(endExclusive.getTime() - DAY_MS);
  const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short" });
  const dayFmt = new Intl.DateTimeFormat("en-US", { day: "numeric" });
  const yearFmt = new Intl.DateTimeFormat("en-US", { year: "numeric" });

  if (start.getMonth() === last.getMonth() && start.getFullYear() === last.getFullYear()) {
    return `${monthFmt.format(start)} ${dayFmt.format(start)} – ${dayFmt.format(last)}, ${yearFmt.format(last)}`;
  }

  return `${monthFmt.format(start)} ${dayFmt.format(start)} – ${monthFmt.format(last)} ${dayFmt.format(last)}, ${yearFmt.format(last)}`;
}

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calendar-day key (YYYY-MM-DD) for a DateTime stored as a pure date.
 * Always uses UTC so US local midnights don't shift the day backward.
 */
export function toDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** User's local calendar today — for "today" highlights in the browser. */
export function localTodayKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parse YYYY-MM-DD into a Date at UTC midnight.
 * Pairs with toDateKey (UTC) so calendar days never shift in US timezones.
 */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

/** Monday-start week containing the given date (UTC calendar). */
export function getMonday(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0)
  );
  const weekday = d.getUTCDay(); // 0 Sun … 6 Sat
  const offset = weekday === 0 ? -6 : 1 - weekday;
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

/** Monday-start week for the user's local "today". */
export function getLocalMonday(now = new Date()): Date {
  return parseDateKey(localTodayKey(now));
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart.getTime());
    day.setUTCDate(day.getUTCDate() + i);
    return day;
  });
}

/**
 * Four Monday-start weeks for the training log, top → bottom:
 * focus week, then previous week, then the two before that.
 */
export function getFourWeekStarts(focusWeekStart: Date): Date[] {
  return Array.from({ length: 4 }, (_, i) => addWeeks(focusWeekStart, -i));
}

/** Range covering focus week plus the three weeks before it. */
export function getPastFourWeekRange(focusWeekStart: Date): {
  start: Date;
  end: Date;
} {
  const firstWeek = addWeeks(focusWeekStart, -3);
  return getMultiWeekRange(firstWeek, 4);
}

export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d;
}

export function getWeekRange(weekStart: Date): { start: Date; end: Date } {
  const start = new Date(
    Date.UTC(
      weekStart.getUTCFullYear(),
      weekStart.getUTCMonth(),
      weekStart.getUTCDate(),
      0
    )
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
    Date.UTC(
      weekStart.getUTCFullYear(),
      weekStart.getUTCMonth(),
      weekStart.getUTCDate(),
      0
    )
  );
  const end = new Date(start.getTime() + weekCount * 7 * DAY_MS);
  return { start, end };
}

export function formatWeekLabel(weekStart: Date): string {
  const days = getWeekDays(weekStart);
  const first = days[0];
  const last = days[6];
  const sameMonth = first.getUTCMonth() === last.getUTCMonth();
  const monthFmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  const dayFmt = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    timeZone: "UTC",
  });
  const yearFmt = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    timeZone: "UTC",
  });

  if (sameMonth) {
    return `${monthFmt.format(first)} ${dayFmt.format(first)} – ${dayFmt.format(last)}, ${yearFmt.format(last)}`;
  }

  return `${monthFmt.format(first)} ${dayFmt.format(first)} – ${monthFmt.format(last)} ${dayFmt.format(last)}, ${yearFmt.format(last)}`;
}

export function formatRangeLabel(start: Date, endExclusive: Date): string {
  const last = new Date(endExclusive.getTime() - DAY_MS);
  const monthFmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  const dayFmt = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    timeZone: "UTC",
  });
  const yearFmt = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    timeZone: "UTC",
  });

  if (
    start.getUTCMonth() === last.getUTCMonth() &&
    start.getUTCFullYear() === last.getUTCFullYear()
  ) {
    return `${monthFmt.format(start)} ${dayFmt.format(start)} – ${dayFmt.format(last)}, ${yearFmt.format(last)}`;
  }

  return `${monthFmt.format(start)} ${dayFmt.format(start)} – ${monthFmt.format(last)} ${dayFmt.format(last)}, ${yearFmt.format(last)}`;
}

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

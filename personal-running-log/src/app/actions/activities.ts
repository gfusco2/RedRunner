"use server";

import { revalidatePath } from "next/cache";
import type {
  ActivityTag,
  ActivityType,
  Prisma,
  SegmentKind,
} from "@prisma/client";
import { ensureProfile, getAuthUser } from "app/actions/auth";
import prisma from "lib/prisma";
import {
  getPastFourWeekRange,
  getWeekRange,
  parseDateKey,
  toDateKey,
} from "lib/training/dates";

export type SegmentInput = {
  kind: SegmentKind;
  distance_miles?: number | null;
  duration_seconds?: number | null;
  pace_seconds?: number | null;
  notes?: string | null;
};

export type CreateActivityInput = {
  date: string;
  type: ActivityType;
  name?: string | null;
  planned?: boolean;
  /** Legacy / simple total when no segments sent. Prefer segments for runs. */
  distance_miles?: number | null;
  duration_seconds?: number | null;
  pace_seconds?: number | null;
  difficulty?: number | null;
  feel?: number | null;
  notes?: string | null;
  shoeId?: number | null;
  tags?: ActivityTag[];
  segments?: SegmentInput[];
  /** Coach only: create on a linked athlete's log. */
  athleteId?: string;
};

const activityInclude = {
  shoe: true,
  segments: { orderBy: { sortOrder: "asc" as const } },
  splits: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.ActivityInclude;

export type ActivityWithDetails = Prisma.ActivityGetPayload<{
  include: typeof activityInclude;
}>;

function revalidateTrainingViews(athleteId?: string) {
  revalidatePath("/training-log");
  revalidatePath("/dashboard");
  revalidatePath("/");
  if (athleteId) revalidatePath(`/coach/${athleteId}`);
}

async function requireUserId(): Promise<string> {
  const authUser = await getAuthUser();
  if (!authUser) {
    throw new Error("Sign in to manage your training log.");
  }
  await ensureProfile();
  return authUser.id;
}

async function ownerFilter(): Promise<Prisma.ActivityWhereInput | null> {
  const authUser = await getAuthUser();
  if (!authUser) return null;
  return { userId: authUser.id };
}

function assertScore(
  label: string,
  value: number | null | undefined,
  required: boolean
): number | null {
  if (value == null || Number.isNaN(Number(value))) {
    if (required) throw new Error(`${label} is required (1–10).`);
    return null;
  }
  const n = Math.round(Number(value));
  if (n < 1 || n > 10) {
    throw new Error(`${label} must be a whole number from 1 to 10.`);
  }
  return n;
}

function normalizeSegment(seg: SegmentInput, label: string): SegmentInput {
  const distance =
    seg.distance_miles != null && seg.distance_miles > 0
      ? seg.distance_miles
      : null;
  const duration =
    seg.duration_seconds != null && seg.duration_seconds > 0
      ? Math.round(seg.duration_seconds)
      : null;
  const pace =
    seg.pace_seconds != null && seg.pace_seconds > 0
      ? Math.round(seg.pace_seconds)
      : null;

  if (distance == null && duration == null) {
    throw new Error(
      `${label} needs an explicit distance or time (e.g. 2 mi or 10 min).`
    );
  }

  return {
    kind: seg.kind,
    distance_miles: distance,
    duration_seconds: duration,
    pace_seconds: pace,
    notes: seg.notes?.trim() || null,
  };
}

function buildRunSegments(input: CreateActivityInput): SegmentInput[] {
  if (input.segments && input.segments.length > 0) {
    const order: SegmentKind[] = ["WU", "MAIN", "CD"];
    const byKind = new Map(
      input.segments.map((s) => [s.kind, s] as const)
    );
    const built: SegmentInput[] = [];
    for (const kind of order) {
      const seg = byKind.get(kind);
      if (!seg) {
        if (kind === "MAIN") {
          throw new Error("Main segment is required for a run.");
        }
        continue;
      }
      const label =
        kind === "WU" ? "Warm-up" : kind === "CD" ? "Cool-down" : "Main";
      built.push(normalizeSegment(seg, label));
    }
    return built;
  }

  // Simple run → single MAIN from top-level fields
  return [
    normalizeSegment(
      {
        kind: "MAIN",
        distance_miles: input.distance_miles,
        duration_seconds: input.duration_seconds,
        pace_seconds: input.pace_seconds,
      },
      "Main"
    ),
  ];
}

function validateActivityInput(input: CreateActivityInput) {
  if (!input.date || Number.isNaN(parseDateKey(input.date).getTime())) {
    throw new Error("Invalid activity date.");
  }

  if (input.type === "RUN") {
    buildRunSegments(input); // validates
  }

  if (input.type === "BIKE" || input.type === "XTRAIN") {
    if (!input.duration_seconds || input.duration_seconds <= 0) {
      throw new Error("Duration must be greater than zero.");
    }
  }

  const planned = Boolean(input.planned);
  assertScore("Difficulty", input.difficulty ?? null, !planned);
  assertScore("Feel", input.feel ?? null, !planned);

  if (input.tags) {
    const allowed = new Set(["EASY", "WORKOUT", "RACE", "LONG"]);
    for (const tag of input.tags) {
      if (!allowed.has(tag)) throw new Error(`Unknown tag: ${tag}`);
    }
  }
}

export async function createActivity(input: CreateActivityInput) {
  validateActivityInput(input);
  const actorId = await requireUserId();

  let ownerId = actorId;
  let prescribedById: string | null = null;

  if (input.athleteId && input.athleteId !== actorId) {
    const link = await prisma.coachAthlete.findUnique({
      where: {
        coachId_athleteId: {
          coachId: actorId,
          athleteId: input.athleteId,
        },
      },
    });
    if (!link) {
      throw new Error("Not linked to that athlete.");
    }
    ownerId = input.athleteId;
    prescribedById = actorId;
  }

  const date = parseDateKey(input.date);
  const planned = Boolean(input.planned);
  const name = input.name?.trim() || null;
  const difficulty = assertScore(
    "Difficulty",
    input.difficulty ?? null,
    !planned
  );
  const feel = assertScore("Feel", input.feel ?? null, !planned);
  const tags = input.tags ?? [];

  let distance_miles: number | null = null;
  let duration_seconds: number | null = null;
  let pace_seconds: number | null = null;
  let segmentRows: {
    kind: SegmentKind;
    sortOrder: number;
    distance_miles: number | null;
    duration_seconds: number | null;
    pace_seconds: number | null;
    notes: string | null;
  }[] = [];

  if (input.type === "RUN") {
    const segments = buildRunSegments(input);
    const sortMap: Record<SegmentKind, number> = { WU: 0, MAIN: 1, CD: 2 };
    segmentRows = segments.map((s) => ({
      kind: s.kind,
      sortOrder: sortMap[s.kind],
      distance_miles: s.distance_miles ?? null,
      duration_seconds: s.duration_seconds ?? null,
      pace_seconds: s.pace_seconds ?? null,
      notes: s.notes ?? null,
    }));

    const milesSum = segmentRows.reduce(
      (acc, s) => acc + (s.distance_miles ?? 0),
      0
    );
    const durSum = segmentRows.reduce(
      (acc, s) => acc + (s.duration_seconds ?? 0),
      0
    );
    distance_miles = milesSum > 0 ? milesSum : null;
    duration_seconds = durSum > 0 ? durSum : null;
    const main = segmentRows.find((s) => s.kind === "MAIN");
    pace_seconds = main?.pace_seconds ?? null;
  } else {
    duration_seconds =
      input.duration_seconds != null && input.duration_seconds > 0
        ? Math.round(input.duration_seconds)
        : null;
  }

  const activity = await prisma.activity.create({
    data: {
      date,
      type: input.type,
      name,
      planned,
      distance_miles,
      duration_seconds,
      pace_seconds,
      difficulty,
      feel,
      notes: input.notes?.trim() || null,
      tags,
      user: { connect: { id: ownerId } },
      ...(prescribedById
        ? { prescribedBy: { connect: { id: prescribedById } } }
        : {}),
      ...(input.type === "RUN" && input.shoeId
        ? { shoe: { connect: { id: input.shoeId } } }
        : {}),
      ...(segmentRows.length > 0
        ? { segments: { create: segmentRows } }
        : {}),
    },
    include: activityInclude,
  });

  if (
    !planned &&
    input.type === "RUN" &&
    input.shoeId &&
    distance_miles
  ) {
    await prisma.shoe.update({
      where: { id: input.shoeId },
      data: { total_miles: { increment: distance_miles } },
    });
  }

  revalidateTrainingViews(input.athleteId);
  return activity;
}

export type SplitInput = {
  label?: string | null;
  distance_miles?: number | null;
  duration_seconds?: number | null;
  rest_seconds?: number | null;
  notes?: string | null;
};

export type CompleteActivityInput = {
  difficulty: number;
  feel: number;
  /** What you actually did — replaces activity notes. */
  notes?: string | null;
  name?: string | null;
  /** Updated segments (what was actually run). Omit to keep prescription. */
  segments?: SegmentInput[];
  /** Interval / rep results. Empty array clears; omit leaves unchanged. */
  splits?: SplitInput[];
  distance_miles?: number | null;
  duration_seconds?: number | null;
  pace_seconds?: number | null;
};

function normalizeSplit(split: SplitInput, index: number): {
  sortOrder: number;
  label: string | null;
  distance_miles: number | null;
  duration_seconds: number | null;
  rest_seconds: number | null;
  notes: string | null;
} {
  const distance =
    split.distance_miles != null && split.distance_miles > 0
      ? split.distance_miles
      : null;
  const duration =
    split.duration_seconds != null && split.duration_seconds > 0
      ? Math.round(split.duration_seconds)
      : null;
  const rest =
    split.rest_seconds != null && split.rest_seconds > 0
      ? Math.round(split.rest_seconds)
      : null;

  if (distance == null && duration == null) {
    throw new Error(
      `Split ${index + 1} needs a distance or time (e.g. 800m or 2:45).`
    );
  }

  return {
    sortOrder: index,
    label: split.label?.trim() || `Rep ${index + 1}`,
    distance_miles: distance,
    duration_seconds: duration,
    rest_seconds: rest,
    notes: split.notes?.trim() || null,
  };
}

/**
 * Athlete completes a planned workout. Plan is a suggestion — they can revise
 * segments, add result notes, and log interval splits for what they actually did.
 */
export async function markActivityCompleted(
  id: number,
  input: CompleteActivityInput
) {
  const userId = await requireUserId();
  const existing = await prisma.activity.findFirst({
    where: { id, userId },
    include: activityInclude,
  });
  if (!existing) {
    throw new Error("Activity not found.");
  }
  if (!existing.planned) {
    return existing;
  }

  const difficulty = assertScore("Difficulty", input.difficulty, true);
  const feel = assertScore("Feel", input.feel, true);

  let segmentRows: SegmentInput[] | null = null;
  let distance_miles = existing.distance_miles;
  let duration_seconds = existing.duration_seconds;
  let pace_seconds = existing.pace_seconds;

  if (existing.type === "RUN" && input.segments && input.segments.length > 0) {
    segmentRows = buildRunSegments({
      date: toDateKey(new Date(existing.date)),
      type: "RUN",
      segments: input.segments,
    });
    distance_miles = segmentRows.reduce(
      (sum, s) => sum + (s.distance_miles ?? 0),
      0
    );
    if (distance_miles <= 0) distance_miles = null;
    const durSum = segmentRows.reduce(
      (sum, s) => sum + (s.duration_seconds ?? 0),
      0
    );
    duration_seconds = durSum > 0 ? durSum : null;
    const main = segmentRows.find((s) => s.kind === "MAIN");
    pace_seconds = main?.pace_seconds ?? null;
  } else if (existing.type !== "RUN") {
    if (input.duration_seconds != null && input.duration_seconds > 0) {
      duration_seconds = Math.round(input.duration_seconds);
    }
  }

  const splitRows =
    input.splits != null
      ? input.splits.map((s, i) => normalizeSplit(s, i))
      : null;

  if (segmentRows) {
    await prisma.activitySegment.deleteMany({ where: { activityId: id } });
    await prisma.activitySegment.createMany({
      data: segmentRows.map((s, i) => ({
        activityId: id,
        kind: s.kind,
        sortOrder: i,
        distance_miles: s.distance_miles ?? null,
        duration_seconds: s.duration_seconds ?? null,
        pace_seconds: s.pace_seconds ?? null,
        notes: s.notes ?? null,
      })),
    });
  }

  if (splitRows) {
    await prisma.activitySplit.deleteMany({ where: { activityId: id } });
    if (splitRows.length > 0) {
      await prisma.activitySplit.createMany({
        data: splitRows.map((s) => ({
          activityId: id,
          ...s,
        })),
      });
    }
  }

  const updated = await prisma.activity.update({
    where: { id },
    data: {
      planned: false,
      difficulty,
      feel,
      notes:
        input.notes !== undefined
          ? input.notes?.trim() || null
          : existing.notes,
      name:
        input.name !== undefined
          ? input.name?.trim() || null
          : existing.name,
      distance_miles,
      duration_seconds,
      pace_seconds,
    },
    include: activityInclude,
  });

  if (updated.type === "RUN" && updated.shoeId && updated.distance_miles) {
    await prisma.shoe.update({
      where: { id: updated.shoeId },
      data: { total_miles: { increment: updated.distance_miles } },
    });
  }

  revalidateTrainingViews();
  return updated;
}

export async function deleteActivity(id: number) {
  const userId = await requireUserId();
  const existing = await prisma.activity.findFirst({
    where: {
      id,
      OR: [{ userId }, { prescribedById: userId }],
    },
  });
  if (!existing) {
    throw new Error("Activity not found.");
  }

  if (
    !existing.planned &&
    existing.type === "RUN" &&
    existing.shoeId &&
    existing.distance_miles
  ) {
    await prisma.shoe.update({
      where: { id: existing.shoeId },
      data: { total_miles: { decrement: existing.distance_miles } },
    });
  }

  await prisma.activity.delete({ where: { id } });
  revalidateTrainingViews(existing.userId ?? undefined);
}

export async function getActivitiesForWeek(weekStartKey: string) {
  const owner = await ownerFilter();
  if (!owner) return [];

  const weekStart = parseDateKey(weekStartKey);
  const { start, end } = getWeekRange(weekStart);

  return prisma.activity.findMany({
    where: {
      ...owner,
      date: { gte: start, lt: end },
    },
    include: activityInclude,
    orderBy: [{ date: "asc" }, { id: "asc" }],
  });
}

/** Fetch activities for focus week plus the three weeks before it. */
export async function getActivitiesForFourWeeks(weekStartKey: string) {
  const owner = await ownerFilter();
  if (!owner) return [];

  const focusWeekStart = parseDateKey(weekStartKey);
  const { start, end } = getPastFourWeekRange(focusWeekStart);

  return prisma.activity.findMany({
    where: {
      ...owner,
      date: { gte: start, lt: end },
    },
    include: activityInclude,
    orderBy: [{ date: "asc" }, { id: "asc" }],
  });
}

export async function getCurrentWeekActivities() {
  const { getMonday, toDateKey } = await import("lib/training/dates");
  const weekStartKey = toDateKey(getMonday(new Date()));
  return getActivitiesForWeek(weekStartKey);
}

/** Inclusive startKey through exclusive endKey for the signed-in user. */
export async function getActivitiesInRange(
  startKey: string,
  endKeyExclusive: string
) {
  const owner = await ownerFilter();
  if (!owner) return [];

  return prisma.activity.findMany({
    where: {
      ...owner,
      date: {
        gte: parseDateKey(startKey),
        lt: parseDateKey(endKeyExclusive),
      },
    },
    include: activityInclude,
    orderBy: [{ date: "asc" }, { id: "asc" }],
  });
}

/** Coach: fetch a linked athlete's activities in a date range. */
export async function getAthleteActivitiesInRange(
  athleteId: string,
  startKey: string,
  endKeyExclusive: string
) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error("Sign in required.");

  const link = await prisma.coachAthlete.findUnique({
    where: {
      coachId_athleteId: { coachId: authUser.id, athleteId },
    },
  });
  if (!link) throw new Error("Not linked to that athlete.");

  return prisma.activity.findMany({
    where: {
      userId: athleteId,
      date: {
        gte: parseDateKey(startKey),
        lt: parseDateKey(endKeyExclusive),
      },
    },
    include: activityInclude,
    orderBy: [{ date: "asc" }, { id: "asc" }],
  });
}

"use server";

import { revalidatePath } from "next/cache";
import type { ActivityType, Prisma } from "@prisma/client";
import { ensureProfile, getAuthUser } from "app/actions/auth";
import prisma from "lib/prisma";
import {
  getPastFourWeekRange,
  getWeekRange,
  parseDateKey,
} from "lib/training/dates";

export type CreateActivityInput = {
  date: string;
  type: ActivityType;
  name?: string | null;
  planned?: boolean;
  distance_miles?: number | null;
  /** Total duration in seconds (from mins + secs UI). */
  duration_seconds?: number | null;
  /** Entered pace as seconds per mile (from m:ss UI). Optional. */
  pace_seconds?: number | null;
  difficulty?: number | null;
  feel?: number | null;
  notes?: string | null;
  shoeId?: number | null;
};

function revalidateTrainingViews() {
  revalidatePath("/training-log");
  revalidatePath("/dashboard");
  revalidatePath("/");
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

function validateActivityInput(input: CreateActivityInput) {
  if (!input.date || Number.isNaN(parseDateKey(input.date).getTime())) {
    throw new Error("Invalid activity date.");
  }

  if (input.type === "RUN") {
    if (!input.distance_miles || input.distance_miles <= 0) {
      throw new Error("Run distance must be greater than zero.");
    }
  }

  if (input.type === "BIKE" || input.type === "XTRAIN") {
    if (!input.duration_seconds || input.duration_seconds <= 0) {
      throw new Error("Duration must be greater than zero.");
    }
  }

  const planned = Boolean(input.planned);
  assertScore("Difficulty", input.difficulty ?? null, !planned);
  assertScore("Feel", input.feel ?? null, !planned);
}

export async function createActivity(input: CreateActivityInput) {
  validateActivityInput(input);
  const userId = await requireUserId();

  const date = parseDateKey(input.date);
  const planned = Boolean(input.planned);
  const duration_seconds =
    input.duration_seconds != null && input.duration_seconds > 0
      ? Math.round(input.duration_seconds)
      : null;
  const pace_seconds =
    input.pace_seconds != null && input.pace_seconds > 0
      ? Math.round(input.pace_seconds)
      : null;
  const name = input.name?.trim() || null;
  const difficulty = assertScore(
    "Difficulty",
    input.difficulty ?? null,
    !planned
  );
  const feel = assertScore("Feel", input.feel ?? null, !planned);

  const activity = await prisma.activity.create({
    data: {
      date,
      type: input.type,
      name,
      planned,
      distance_miles: input.type === "RUN" ? input.distance_miles ?? null : null,
      duration_seconds,
      pace_seconds: input.type === "RUN" ? pace_seconds : null,
      difficulty,
      feel,
      notes: input.notes?.trim() || null,
      user: { connect: { id: userId } },
      ...(input.type === "RUN" && input.shoeId
        ? { shoe: { connect: { id: input.shoeId } } }
        : {}),
    },
    include: { shoe: true },
  });

  if (
    !planned &&
    input.type === "RUN" &&
    input.shoeId &&
    input.distance_miles
  ) {
    await prisma.shoe.update({
      where: { id: input.shoeId },
      data: { total_miles: { increment: input.distance_miles } },
    });
  }

  revalidateTrainingViews();
  return activity;
}

export async function markActivityCompleted(
  id: number,
  scores: { difficulty: number; feel: number }
) {
  const userId = await requireUserId();
  const existing = await prisma.activity.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error("Activity not found.");
  }
  if (!existing.planned) {
    return existing;
  }

  const difficulty = assertScore("Difficulty", scores.difficulty, true);
  const feel = assertScore("Feel", scores.feel, true);

  const updated = await prisma.activity.update({
    where: { id },
    data: {
      planned: false,
      difficulty,
      feel,
    },
    include: { shoe: true },
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
    where: { id, userId },
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
  revalidateTrainingViews();
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
    include: { shoe: true },
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
    include: { shoe: true },
    orderBy: [{ date: "asc" }, { id: "asc" }],
  });
}

export async function getCurrentWeekActivities() {
  const { getMonday, toDateKey } = await import("lib/training/dates");
  const weekStartKey = toDateKey(getMonday(new Date()));
  return getActivitiesForWeek(weekStartKey);
}

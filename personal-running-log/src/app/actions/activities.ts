"use server";

import { revalidatePath } from "next/cache";
import type { ActivityType } from "@prisma/client";
import prisma from "lib/prisma";
import {
  getMultiWeekRange,
  getWeekRange,
  parseDateKey,
} from "lib/training/dates";

export type CreateActivityInput = {
  date: string;
  type: ActivityType;
  name?: string | null;
  planned?: boolean;
  distance_miles?: number | null;
  duration_minutes?: number | null;
  notes?: string | null;
  shoeId?: number | null;
};

function revalidateTrainingViews() {
  revalidatePath("/training-log");
  revalidatePath("/dashboard");
  revalidatePath("/");
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
    if (!input.duration_minutes || input.duration_minutes <= 0) {
      throw new Error("Duration must be greater than zero.");
    }
  }
}

export async function createActivity(input: CreateActivityInput) {
  validateActivityInput(input);

  const date = parseDateKey(input.date);
  const planned = Boolean(input.planned);
  const duration_seconds = input.duration_minutes
    ? Math.round(input.duration_minutes * 60)
    : null;
  const name = input.name?.trim() || null;

  const activity = await prisma.activity.create({
    data: {
      date,
      type: input.type,
      name,
      planned,
      distance_miles: input.type === "RUN" ? input.distance_miles ?? null : null,
      duration_seconds:
        input.type === "RUN" ? duration_seconds : duration_seconds ?? null,
      notes: input.notes?.trim() || null,
      shoeId: input.type === "RUN" ? input.shoeId ?? null : null,
    },
    include: { shoe: true },
  });

  // Only count completed runs toward shoe mileage
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

export async function markActivityCompleted(id: number) {
  const existing = await prisma.activity.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Activity not found.");
  }
  if (!existing.planned) {
    return existing;
  }

  const updated = await prisma.activity.update({
    where: { id },
    data: { planned: false },
    include: { shoe: true },
  });

  if (
    updated.type === "RUN" &&
    updated.shoeId &&
    updated.distance_miles
  ) {
    await prisma.shoe.update({
      where: { id: updated.shoeId },
      data: { total_miles: { increment: updated.distance_miles } },
    });
  }

  revalidateTrainingViews();
  return updated;
}

export async function deleteActivity(id: number) {
  const existing = await prisma.activity.findUnique({ where: { id } });
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
  const weekStart = parseDateKey(weekStartKey);
  const { start, end } = getWeekRange(weekStart);

  return prisma.activity.findMany({
    where: {
      date: { gte: start, lt: end },
    },
    include: { shoe: true },
    orderBy: [{ date: "asc" }, { id: "asc" }],
  });
}

/** Fetch activities across 4 Monday-start weeks from weekStartKey. */
export async function getActivitiesForFourWeeks(weekStartKey: string) {
  const weekStart = parseDateKey(weekStartKey);
  const { start, end } = getMultiWeekRange(weekStart, 4);

  return prisma.activity.findMany({
    where: {
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

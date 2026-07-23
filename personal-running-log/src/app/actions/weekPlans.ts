"use server";

import { revalidatePath } from "next/cache";
import type { WeekPlan } from "@prisma/client";
import { ensureProfile, getAuthUser } from "app/actions/auth";
import prisma from "lib/prisma";
import { parseDateKey } from "lib/training/dates";
import {
  DEFAULT_GOAL_RANGE_MILES,
  resolveGoalRange,
} from "lib/training/goals";

async function requireUserId(): Promise<string> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error("Sign in to manage week plans.");
  await ensureProfile();
  return authUser.id;
}

async function assertCanAccessAthlete(
  userId: string,
  athleteId: string
): Promise<void> {
  if (athleteId === userId) return;
  const link = await prisma.coachAthlete.findUnique({
    where: {
      coachId_athleteId: { coachId: userId, athleteId },
    },
  });
  if (!link) throw new Error("Not linked to that athlete.");
}

export async function getWeekPlan(
  weekStartKey: string,
  athleteId?: string
): Promise<WeekPlan | null> {
  const userId = await getAuthUser().then((u) => u?.id ?? null);
  if (!userId) return null;

  const targetId = athleteId ?? userId;
  await assertCanAccessAthlete(userId, targetId);

  return prisma.weekPlan.findUnique({
    where: {
      athleteId_weekStart: {
        athleteId: targetId,
        weekStart: parseDateKey(weekStartKey),
      },
    },
  });
}

/** Week plans whose Monday falls in [startKey, endKey] inclusive. */
export async function getWeekPlansInRange(
  startKey: string,
  endKey: string,
  athleteId?: string
): Promise<WeekPlan[]> {
  const userId = await getAuthUser().then((u) => u?.id ?? null);
  if (!userId) return [];

  const targetId = athleteId ?? userId;
  await assertCanAccessAthlete(userId, targetId);

  return prisma.weekPlan.findMany({
    where: {
      athleteId: targetId,
      weekStart: {
        gte: parseDateKey(startKey),
        lte: parseDateKey(endKey),
      },
    },
    orderBy: { weekStart: "asc" },
  });
}

export async function upsertWeekPlan(input: {
  weekStartKey: string;
  athleteId?: string;
  goalRunMiles?: number | null;
  goalRangeMiles?: number | null;
  runDays?: number | null;
  notes?: string | null;
}) {
  const userId = await requireUserId();
  const athleteId = input.athleteId ?? userId;
  await assertCanAccessAthlete(userId, athleteId);

  const weekStart = parseDateKey(input.weekStartKey);
  const goal =
    input.goalRunMiles != null && input.goalRunMiles > 0
      ? input.goalRunMiles
      : null;
  const range =
    goal == null
      ? null
      : resolveGoalRange(
          input.goalRangeMiles ?? DEFAULT_GOAL_RANGE_MILES
        );
  const runDays =
    input.runDays != null && input.runDays > 0
      ? Math.round(input.runDays)
      : null;

  const plan = await prisma.weekPlan.upsert({
    where: {
      athleteId_weekStart: { athleteId, weekStart },
    },
    create: {
      athleteId,
      coachId: athleteId === userId ? null : userId,
      weekStart,
      goalRunMiles: goal,
      goalRangeMiles: range,
      runDays,
      notes: input.notes?.trim() || null,
    },
    update: {
      coachId: athleteId === userId ? null : userId,
      goalRunMiles: goal,
      goalRangeMiles: range,
      runDays,
      notes: input.notes?.trim() || null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/training-log");
  if (athleteId !== userId) {
    revalidatePath(`/coach/${athleteId}`);
  }
  return plan;
}

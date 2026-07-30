"use server";

import { revalidatePath } from "next/cache";
import type { DayWellness } from "@prisma/client";
import { ensureProfile, getAuthUser } from "lib/auth/profile";
import prisma from "lib/prisma";
import { parseDateKey } from "lib/training/dates";

async function requireUserId(): Promise<string> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error("Sign in to update wellness.");
  await ensureProfile();
  return authUser.id;
}

export async function getDayWellness(
  dateKey: string
): Promise<DayWellness | null> {
  const authUser = await getAuthUser();
  if (!authUser) return null;
  return prisma.dayWellness.findUnique({
    where: {
      userId_date: {
        userId: authUser.id,
        date: parseDateKey(dateKey),
      },
    },
  });
}

export async function getWellnessForRange(
  startKey: string,
  endKeyExclusive: string
): Promise<DayWellness[]> {
  const authUser = await getAuthUser();
  if (!authUser) return [];
  return prisma.dayWellness.findMany({
    where: {
      userId: authUser.id,
      date: {
        gte: parseDateKey(startKey),
        lt: parseDateKey(endKeyExclusive),
      },
    },
    orderBy: { date: "asc" },
  });
}

export async function upsertDayWellness(input: {
  dateKey: string;
  strengthDone: boolean;
  strengthFocus?: string | null;
  stretchDone: boolean;
  stretchFocus?: string | null;
}) {
  const userId = await requireUserId();
  const date = parseDateKey(input.dateKey);

  const row = await prisma.dayWellness.upsert({
    where: { userId_date: { userId, date } },
    create: {
      userId,
      date,
      strengthDone: input.strengthDone,
      strengthFocus: input.strengthDone
        ? input.strengthFocus?.trim() || null
        : null,
      stretchDone: input.stretchDone,
      stretchFocus: input.stretchDone
        ? input.stretchFocus?.trim() || null
        : null,
    },
    update: {
      strengthDone: input.strengthDone,
      strengthFocus: input.strengthDone
        ? input.strengthFocus?.trim() || null
        : null,
      stretchDone: input.stretchDone,
      stretchFocus: input.stretchDone
        ? input.stretchFocus?.trim() || null
        : null,
    },
  });

  revalidatePath("/training-log");
  revalidatePath("/dashboard");
  return row;
}

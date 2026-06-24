"use server";

import { revalidatePath } from "next/cache";
import prisma from "lib/prisma";

export type CreateRunInput = {
  date: string;
  distance_miles: number;
  duration_seconds: number;
  notes?: string | null;
  shoeId?: number | null;
};

export async function createRun(input: CreateRunInput) {
  const date = new Date(input.date);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid run date.");
  }

  if (input.distance_miles <= 0) {
    throw new Error("Distance must be greater than zero.");
  }

  if (input.duration_seconds <= 0) {
    throw new Error("Duration must be greater than zero.");
  }

  const run = await prisma.$transaction(async (tx) => {
    const created = await tx.run.create({
      data: {
        date,
        distance_miles: input.distance_miles,
        duration_seconds: input.duration_seconds,
        notes: input.notes?.trim() || null,
        shoeId: input.shoeId ?? null,
      },
      include: { shoe: true },
    });

    if (input.shoeId) {
      await tx.shoe.update({
        where: { id: input.shoeId },
        data: { total_miles: { increment: input.distance_miles } },
      });
    }

    return created;
  });

  revalidatePath("/");
  return run;
}

export async function getRuns() {
  return prisma.run.findMany({
    include: { shoe: true },
    orderBy: { date: "desc" },
  });
}

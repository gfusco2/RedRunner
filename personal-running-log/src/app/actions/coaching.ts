"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@prisma/client";
import { ensureProfile, getAuthUser, getCurrentProfile } from "app/actions/auth";
import prisma from "lib/prisma";

async function requireUserId(): Promise<string> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error("Sign in required.");
  await ensureProfile();
  return authUser.id;
}

export async function listMyAthletes(): Promise<User[]> {
  const userId = await getAuthUser().then((u) => u?.id ?? null);
  if (!userId) return [];

  const links = await prisma.coachAthlete.findMany({
    where: { coachId: userId },
    include: { athlete: true },
    orderBy: { createdAt: "asc" },
  });
  return links.map((l) => l.athlete);
}

export async function listMyCoaches(): Promise<User[]> {
  const userId = await getAuthUser().then((u) => u?.id ?? null);
  if (!userId) return [];

  const links = await prisma.coachAthlete.findMany({
    where: { athleteId: userId },
    include: { coach: true },
    orderBy: { createdAt: "asc" },
  });
  return links.map((l) => l.coach);
}

/** Link yourself as coach to an existing user by email. */
export async function linkAthleteByEmail(email: string) {
  const coachId = await requireUserId();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Profile missing.");

  const trimmed = email.trim().toLowerCase();
  if (!trimmed) throw new Error("Enter an athlete email.");
  if (trimmed === profile.email.toLowerCase()) {
    throw new Error("You cannot link yourself as an athlete.");
  }

  const athlete = await prisma.user.findUnique({ where: { email: trimmed } });
  if (!athlete) {
    throw new Error(
      "No RedRunner account with that email yet. Ask them to sign up first."
    );
  }

  await prisma.coachAthlete.upsert({
    where: {
      coachId_athleteId: { coachId, athleteId: athlete.id },
    },
    create: { coachId, athleteId: athlete.id },
    update: {},
  });

  // Promote to COACH if still RUNNER (ADMIN stays)
  if (profile.role === "RUNNER") {
    await prisma.user.update({
      where: { id: coachId },
      data: { role: "COACH" },
    });
  }

  revalidatePath("/settings");
  revalidatePath("/coach");
  return athlete;
}

export async function unlinkAthlete(athleteId: string) {
  const coachId = await requireUserId();
  await prisma.coachAthlete.deleteMany({
    where: { coachId, athleteId },
  });
  revalidatePath("/settings");
  revalidatePath("/coach");
}

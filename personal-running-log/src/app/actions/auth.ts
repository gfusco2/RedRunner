"use server";

import type { DistanceUnit as PrismaDistanceUnit } from "@prisma/client";
import prisma from "lib/prisma";
import { ensureProfile } from "lib/auth/profile";
import { createClient } from "lib/supabase/server";
import type { DistanceUnit } from "lib/training/format";

export async function updateProfile(input: {
  name?: string;
  distanceUnit?: DistanceUnit;
}) {
  const profile = await ensureProfile();
  if (!profile) {
    throw new Error("Sign in to update settings.");
  }

  const distanceUnit: PrismaDistanceUnit | undefined =
    input.distanceUnit === "km"
      ? "KM"
      : input.distanceUnit === "mi"
        ? "MI"
        : undefined;

  return prisma.user.update({
    where: { id: profile.id },
    data: {
      ...(input.name != null ? { name: input.name.trim() || null } : {}),
      ...(distanceUnit ? { distanceUnit } : {}),
    },
  });
}

export async function signOut() {
  const { redirect } = await import("next/navigation");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

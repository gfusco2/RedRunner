"use server";

import type { DistanceUnit as PrismaDistanceUnit, User } from "@prisma/client";
import prisma from "lib/prisma";
import { createClient } from "lib/supabase/server";
import type { DistanceUnit } from "lib/training/format";

export async function getAuthUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

/** Ensure a Prisma User row exists for the signed-in Supabase user. */
export async function ensureProfile(): Promise<User | null> {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.email) return null;

    const existing = await prisma.user.findUnique({
      where: { id: authUser.id },
    });
    if (existing) return existing;

    return prisma.user.create({
      data: {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name ?? authUser.email.split("@")[0],
        role: "RUNNER",
        distanceUnit: "MI",
      },
    });
  } catch (err) {
    console.error("ensureProfile failed", err);
    return null;
  }
}

export async function getCurrentProfile(): Promise<User | null> {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return null;
    return (
      (await prisma.user.findUnique({ where: { id: authUser.id } })) ??
      (await ensureProfile())
    );
  } catch (err) {
    console.error("getCurrentProfile failed", err);
    return null;
  }
}

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

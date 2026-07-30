import { cache } from "react";
import type { User } from "@prisma/client";
import { cookies } from "next/headers";
import prisma from "lib/prisma";
import { createClient } from "lib/supabase/server";

/** True when a Supabase SSR session cookie is present. */
export async function hasAuthSessionCookie(): Promise<boolean> {
  const store = await cookies();
  return store.getAll().some((c) => c.name.includes("-auth-token"));
}

export const getAuthUser = cache(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  // Avoid Supabase network + Prisma for anonymous / bot traffic.
  if (!(await hasAuthSessionCookie())) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

/** Ensure a Prisma User row exists for the signed-in Supabase user. */
export const ensureProfile = cache(async (): Promise<User | null> => {
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
});

export const getCurrentProfile = cache(async (): Promise<User | null> => {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return null;
    return (
      (await prisma.user.findUnique({ where: { id: authUser.id } })) ??
      (await ensureProfile())
    );
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.includes("Dynamic server usage") ||
        // @ts-expect-error Next digest
        err.digest === "DYNAMIC_SERVER_USAGE")
    ) {
      throw err;
    }
    console.error("getCurrentProfile failed", err);
    return null;
  }
});

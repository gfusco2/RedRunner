import { NextResponse } from "next/server";
import { ensureProfile } from "lib/auth/profile";

export async function POST() {
  const profile = await ensureProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, id: profile.id });
}

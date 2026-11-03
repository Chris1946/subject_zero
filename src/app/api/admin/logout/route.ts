import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, clearSession } from "@/lib/session.server";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearSession(ADMIN_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}

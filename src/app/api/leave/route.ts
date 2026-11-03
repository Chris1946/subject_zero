import { NextResponse } from "next/server";
import { clearSession, TEAM_COOKIE_NAME } from "@/lib/session.server";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearSession(TEAM_COOKIE_NAME);
  return NextResponse.json({ success: true }, { status: 200 });
}

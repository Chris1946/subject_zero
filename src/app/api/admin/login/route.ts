import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { env } from "@/lib/env.server";
import { createAdminSession } from "@/lib/session.server";
import { getServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIG } from "@/lib/rate-limits";

export const dynamic = "force-dynamic";

const LoginSchema = z.object({
  password: z.string().min(1, "Password is required").max(200, "Password too long"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // Enforce 5 attempts per 5 minutes per IP
    const rateLimitResponse = await checkRateLimit(
      `admin_login_ip:${ip}`,
      RATE_LIMIT_CONFIG.ADMIN_LOGIN_PER_IP.max,
      RATE_LIMIT_CONFIG.ADMIN_LOGIN_PER_IP.windowSeconds
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const rawBody = await req.json().catch(() => null);
    const parsed = LoginSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const { password } = parsed.data;

    // Constant-time password comparison
    const expected = Buffer.from(env.ADMIN_PASSWORD, "utf8");
    const provided = Buffer.from(password, "utf8");
    const isMatch =
      expected.length === provided.length &&
      crypto.timingSafeEqual(expected, provided);

    const supabase = getServerClient();

    if (!isMatch) {
      // Audit log failed login attempt
      await supabase.from("admin_log").insert({
        action: "admin_login_failed",
        detail: { ip },
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createAdminSession();

    // Audit log successful login
    await supabase.from("admin_log").insert({
      action: "admin_login_success",
      detail: { ip },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: "Authentication processing failed", details: message },
      { status: 500 }
    );
  }
}

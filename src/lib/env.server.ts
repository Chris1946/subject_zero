import "server-only";
import { z } from "zod";

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  ADMIN_PASSWORD: z.string().min(1, "ADMIN_PASSWORD is required"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters long"),
  EVENT_MODE: z.enum(["onsite", "remote"]).default("remote"),
  RATE_LIMIT_ANSWERS_PER_IP: z.coerce.number().positive().optional(),
  RATE_LIMIT_JOIN_PER_IP: z.coerce.number().positive().optional(),
  RATE_LIMIT_LEADERBOARD_PER_IP: z.coerce.number().positive().optional(),
  RATE_LIMIT_STATE_PER_IP: z.coerce.number().positive().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    const result = EnvSchema.safeParse(process.env);
    if (!result.success) {
      const issues = result.error.issues
        .map((issue) => ` - ${issue.path.join(".")}: ${issue.message}`)
        .join("\n");
      throw new Error(`[FATAL] Missing or invalid environment variables:\n${issues}`);
    }
    cachedEnv = result.data;
  }
  return cachedEnv;
}

export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return getEnv()[prop as keyof Env];
  },
});

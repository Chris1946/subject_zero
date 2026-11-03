import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env.server";

let serverClient: SupabaseClient | null = null;

/**
 * Creates a Supabase client using the Service Role Key.
 * MUST ONLY be called on the server to bypass RLS and maintain security.
 */
export function createServerClient(): SupabaseClient {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Returns a singleton instance of the server Supabase client.
 */
export function getServerClient(): SupabaseClient {
  if (!serverClient) {
    serverClient = createServerClient();
  }
  return serverClient;
}

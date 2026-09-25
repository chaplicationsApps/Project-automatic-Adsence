import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./env";

/** Stateless anonymous client: public rendering never inherits an admin session. */
export function createPublicClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  return createClient(config.url, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

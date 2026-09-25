import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./env";

export async function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase no está configurado.");
  const cookieStore = await cookies();

  // A new client per request prevents session sharing between users.
  return createServerClient(config.url, config.publishableKey, {
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. The /admin proxy refreshes them.
        }
      },
    },
  });
}

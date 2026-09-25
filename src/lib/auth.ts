import "server-only";

import { redirect } from "next/navigation";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function getAdminAccess() {
  if (!getSupabaseConfig()) return { status: "setup" as const };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return { status: "anonymous" as const };
    if (data.user.app_metadata?.role !== "admin") {
      return { status: "forbidden" as const };
    }
    return { status: "admin" as const, user: data.user, supabase };
  } catch {
    return { status: "unavailable" as const };
  }
}

export async function requireAdmin() {
  const access = await getAdminAccess();
  if (access.status === "admin") return access;
  if (access.status === "setup") redirect("/admin/login?status=setup");
  if (access.status === "forbidden") redirect("/admin/login?status=forbidden");
  if (access.status === "unavailable") redirect("/admin/login?status=unavailable");
  redirect("/admin/login");
}

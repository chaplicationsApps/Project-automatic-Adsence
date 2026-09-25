"use server";

import { redirect } from "next/navigation";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

export async function signIn(_previous: LoginState, formData: FormData): Promise<LoginState> {
  if (!getSupabaseConfig()) return { error: "El acceso aún no está configurado." };

  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string" ||
      !email.trim() || email.length > 254 || !password || password.length > 4096) {
    return { error: "Introduce un correo y una contraseña válidos." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { error: "No se ha podido iniciar sesión. Comprueba tus datos o inténtalo más tarde." };

    // Verify the current user at the Auth server, including their trusted role.
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || data.user?.app_metadata?.role !== "admin") {
      await supabase.auth.signOut({ scope: "local" });
      return { error: "Esta cuenta no tiene acceso a la administración." };
    }
  } catch {
    return { error: "El servicio de acceso no está disponible. Inténtalo más tarde." };
  }

  redirect("/admin");
}

export async function signOut() {
  let failed = false;
  if (getSupabaseConfig()) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.signOut({ scope: "local" });
      failed = Boolean(error);
    } catch {
      failed = true;
    }
  }
  if (failed) redirect("/admin/login?status=signout-failed");
  redirect("/admin/login");
}

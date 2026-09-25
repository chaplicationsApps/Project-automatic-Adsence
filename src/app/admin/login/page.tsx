import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { signOut } from "../actions";
import styles from "../admin.module.css";

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ status?: string }>;
}) {
  const access = await getAdminAccess();
  const { status } = await searchParams;
  if (access.status === "admin" && status !== "signout-failed") redirect("/admin");

  return (
    <div className={`container ${styles.loginShell}`}>
      <section className={styles.loginCard} aria-labelledby="login-title">
        <p className="eyebrow">MicroTools · Administración</p>
        <h1 id="login-title">Tu espacio de trabajo.</h1>
        <p className={styles.intro}>Consulta las herramientas y la configuración de la plataforma.</p>
        {access.status === "setup" ? (
          <div className={styles.setup}>
            <h2>Acceso pendiente de configuración</h2>
            <p>El panel permanecerá cerrado hasta conectar Supabase y configurar una cuenta administradora.</p>
            <p>La guía de preparación está en <code>docs/ADMIN_SETUP.md</code>, dentro del repositorio.</p>
          </div>
        ) : (
          <>
            {(access.status === "forbidden" || status === "forbidden") && (
              <p className={styles.error} role="alert">La sesión actual no tiene permisos de administración.</p>
            )}
            {(access.status === "unavailable" || status === "unavailable") && (
              <p className={styles.error} role="alert">No podemos comprobar el acceso ahora. Inténtalo de nuevo más tarde.</p>
            )}
            {status === "signout-failed" && (
              <p className={styles.error} role="alert">No se ha podido cerrar la sesión. Vuelve a intentarlo.</p>
            )}
            <LoginForm />
            {(access.status === "forbidden" || status === "signout-failed") && (
              <form action={signOut}><button className={styles.textButton} type="submit">Cerrar la sesión actual</button></form>
            )}
          </>
        )}
        <Link href="/" className={styles.backLink}>← Volver a las herramientas</Link>
      </section>
    </div>
  );
}

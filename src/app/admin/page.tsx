import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "./actions";
import styles from "./admin.module.css";

type ToolRow = {
  id: string; slug: string; title: string; category_slug: string;
  status: string; current_version: number | null; updated_at: string;
};
type SettingRow = { key: string; value: unknown; description: string };

const statuses: Record<string, string> = {
  draft: "Borrador", review: "En revisión", published: "Publicada", archived: "Archivada",
};

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const [toolsResult, settingsResult] = await Promise.all([
    supabase.from("tool_definitions")
      .select("id,slug,title,category_slug,status,current_version,updated_at")
      .order("updated_at", { ascending: false }).limit(100),
    supabase.from("system_settings").select("key,value,description").order("key"),
  ]);
  const tools = (toolsResult.data ?? []) as ToolRow[];
  const settings = (settingsResult.data ?? []) as SettingRow[];

  return (
    <div className={`container ${styles.dashboard}`}>
      <header className={styles.heading}>
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Estado de la plataforma</h1>
          <p className={styles.intro}>Herramientas y funciones conectadas a tu proyecto.</p>
        </div>
        <form action={signOut}><button className="button button-secondary" type="submit">Cerrar sesión</button></form>
      </header>

      <section className={styles.card} aria-labelledby="tools-heading">
        <div className={styles.sectionHeading}>
          <h2 id="tools-heading">Herramientas</h2>
          {!toolsResult.error && <span className={styles.help}>{tools.length} mostradas · máximo 100</span>}
        </div>
        {toolsResult.error ? (
          <p className={styles.error} role="alert">No se pudo cargar el catálogo. Comprueba la conexión y las migraciones del proyecto.</p>
        ) : tools.length === 0 ? (
          <p className={styles.empty}>Todavía no hay herramientas en la base de datos.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>Herramientas registradas y sus versiones publicadas</caption>
              <thead><tr><th scope="col">Herramienta</th><th scope="col">Categoría</th><th scope="col">Estado</th><th scope="col">Versión publicada</th></tr></thead>
              <tbody>{tools.map((tool) => (
                <tr key={tool.id}>
                  <td>{tool.status === "published" ? <Link href={`/herramientas/${tool.slug}`}>{tool.title}</Link> : tool.title}<small>/{tool.slug}</small></td>
                  <td>{tool.category_slug}</td>
                  <td><span className={styles.badge}>{statuses[tool.status] ?? tool.status}</span></td>
                  <td>{tool.current_version === null ? "Sin publicar" : `v${tool.current_version}`}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.card} aria-labelledby="settings-heading">
        <h2 id="settings-heading">Funciones e integraciones</h2>
        {settingsResult.error ? (
          <p className={styles.error} role="alert">No se pudo cargar la configuración de la base de datos.</p>
        ) : settings.length === 0 ? (
          <p className={styles.empty}>No hay opciones registradas. Aplica la migración inicial para crear los valores seguros.</p>
        ) : (
          <dl className={styles.settings}>{settings.map((setting) => (
            <div key={setting.key}>
              <dt>{setting.description || setting.key}<small>{setting.key}</small></dt>
              <dd><span className={styles.badge}>{setting.value === true ? "Activada" : setting.value === false ? "Desactivada" : JSON.stringify(setting.value)}</span></dd>
            </div>
          ))}</dl>
        )}
        <p className={styles.help}>Vista de consulta. La edición, aprobación y publicación desde este panel se incorporarán en la siguiente fase.</p>
      </section>
    </div>
  );
}

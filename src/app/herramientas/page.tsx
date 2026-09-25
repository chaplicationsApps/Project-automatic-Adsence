import type { Metadata } from "next";
import { getPublishedTools } from "@/lib/catalog";
import { CatalogView } from "@/components/catalog-view";

export const metadata: Metadata = { title: "Todas las herramientas", description: "Encuentra calculadoras, herramientas de fechas y conversores gratuitos para resolver las pequeñas dudas del día a día.", alternates: { canonical: "/herramientas" } };

export default async function ToolsPage() {
  const tools = await getPublishedTools();
  return <CatalogView title="Lo que necesitas. A mano." description="Calcula, convierte y resuelve. Elige una herramienta y vamos a ello." tools={[...tools].sort((a, b) => a.title.localeCompare(b.title, "es"))} />;
}
export const dynamic = "force-dynamic";

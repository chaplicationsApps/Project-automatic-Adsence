import type { Metadata } from "next";
import { getPublishedTools } from "@/lib/catalog";
import { CatalogView, normalizedSearch } from "@/components/catalog-view";
import { categories } from "@/lib/tools/seeds";

export const metadata: Metadata = { title: "Buscar herramientas", description: "Busca una calculadora o conversor en Claro.", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").slice(0, 120).trim();
  const terms = normalizedSearch(query).split(/\s+/).filter(Boolean);
  const tools = (await getPublishedTools()).filter((tool) => {
    const category = categories.find((item) => item.slug === tool.category);
    const text = normalizedSearch(`${tool.title} ${tool.shortDescription} ${category?.name ?? tool.category} ${tool.content.intro}`);
    return terms.every((term) => text.includes(term));
  });
  return <CatalogView title={query ? `Resultados para «${query}»` : "Vamos a encontrarlo."} description={query ? "Tu próxima respuesta puede estar aquí." : "Busca por nombre, categoría o lo que necesitas calcular."} tools={tools} query={query} />;
}
export const dynamic = "force-dynamic";

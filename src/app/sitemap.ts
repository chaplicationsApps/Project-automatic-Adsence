import type { MetadataRoute } from "next";
import { getIndexableTools } from "@/lib/catalog";
import { getBaseUrl, isSiteIndexable } from "@/lib/site";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSiteIndexable()) return [];
  const base = getBaseUrl();
  const tools = await getIndexableTools();
  const categories = [...new Set(tools.map((tool) => tool.category))];
  return ["", "/herramientas", ...categories.map((category) => `/categoria/${category}`), ...tools.map((tool) => `/herramientas/${tool.slug}`)]
    .map((path) => ({ url: `${base}${path}` }));
}

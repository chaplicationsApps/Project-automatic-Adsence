import "server-only";
import { cache } from "react";
import { seedTools } from "@/lib/tools/seeds";
import { validateDefinition, type ToolDefinition } from "@/lib/tools/schema";
import { createPublicClient } from "@/lib/supabase/public";

type PublishedEntry = { definition: ToolDefinition; isIndexable: boolean };

/** Public reads always use an anonymous client, including when an admin visits. */
const getPublishedEntries = cache(async (): Promise<PublishedEntry[]> => {
  if (process.env.CATALOG_SOURCE === "seed") {
    return seedTools.filter((tool) => tool.status === "published").map((definition) => ({ definition, isIndexable: true }));
  }
  const supabase = createPublicClient();
  if (!supabase) throw new Error("Configura Supabase o activa CATALOG_SOURCE=seed para una vista de desarrollo.");
  const { data: rows, error } = await supabase
    .from("tool_definitions")
    .select("id,slug,category_slug,current_version,is_indexable")
    .eq("status", "published")
    .order("published_at", { ascending: true });
  if (error) {
    console.error(JSON.stringify({ event: "catalog.read_failed", code: error.code }));
    throw new Error("No se ha podido cargar el catálogo.");
  }
  if (!rows?.length) return [];
  const { data: versions, error: versionError } = await supabase
    .from("tool_versions").select("tool_id,version,definition").in("tool_id", rows.map((row) => row.id));
  if (versionError) {
    console.error(JSON.stringify({ event: "catalog.versions_failed", code: versionError.code }));
    throw new Error("No se han podido cargar las herramientas.");
  }
  return rows.map((row) => {
    const record = versions?.find((version) => version.tool_id === row.id && version.version === row.current_version);
    const parsed = validateDefinition(record?.definition);
    if (!parsed.ok || parsed.definition.slug !== row.slug || parsed.definition.category !== row.category_slug || parsed.definition.version !== row.current_version || parsed.definition.status !== "published") {
      console.error(JSON.stringify({ event: "catalog.invalid_definition", slug: row.slug }));
      throw new Error("Una herramienta necesita revisión. Vuelve a intentarlo más tarde.");
    }
    return { definition: parsed.definition, isIndexable: row.is_indexable === true };
  });
});

export const getPublishedTools = cache(async (): Promise<ToolDefinition[]> => {
  return (await getPublishedEntries()).map((entry) => entry.definition);
});

export const getPublishedTool = cache(async (slug: string) => {
  return (await getPublishedTools()).find((tool) => tool.slug === slug) ?? null;
});

/** Indexation belongs to publication metadata, never to the strict tool definition. */
export const getIndexableTools = cache(async (): Promise<ToolDefinition[]> => {
  return (await getPublishedEntries()).filter((entry) => entry.isIndexable).map((entry) => entry.definition);
});

export const getToolIndexable = cache(async (slug: string): Promise<boolean> => {
  return (await getPublishedEntries()).find((entry) => entry.definition.slug === slug)?.isIndexable ?? false;
});

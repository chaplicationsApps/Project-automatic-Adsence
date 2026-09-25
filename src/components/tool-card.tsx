import Link from "next/link";
import { ArrowUpRight, CalendarDays, Percent, Ruler, Sparkles } from "lucide-react";
import type { ToolDefinition } from "@/lib/tools/schema";
import { categories } from "@/lib/tools/seeds";

export function CategoryIcon({ category, size = 24 }: { category: string; size?: number }) {
  const Icon = category === "matematicas" ? Percent : category === "fechas" ? CalendarDays : category === "conversiones" ? Ruler : Sparkles;
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  const category = categories.find((item) => item.slug === tool.category);
  return (
    <Link href={`/herramientas/${tool.slug}`} className="tool-card">
      <div className="tool-card-top"><span className={`category-icon category-${tool.category}`}><CategoryIcon category={tool.category} /></span><ArrowUpRight size={20} className="tool-card-arrow" aria-hidden="true" /></div>
      <span className="tool-category-label">{category?.name ?? tool.category}</span>
      <h3>{tool.title}</h3>
      <p>{tool.shortDescription}</p>
      <span className="tool-card-bottom">Abrir herramienta <span aria-hidden="true">→</span></span>
    </Link>
  );
}

export function ToolGrid({ tools }: { tools: ToolDefinition[] }) {
  return <div className="tool-grid">{tools.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}</div>;
}

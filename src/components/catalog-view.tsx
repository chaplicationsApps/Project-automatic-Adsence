import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { categories } from "@/lib/tools/seeds";
import type { ToolDefinition } from "@/lib/tools/schema";
import { SearchForm } from "@/components/search-form";
import { ToolGrid } from "@/components/tool-card";

export function normalizedSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
}

export function CatalogView({ title, description, tools, query, activeCategory }: { title: string; description: string; tools: ToolDefinition[]; query?: string; activeCategory?: string }) {
  return (
    <div className="container catalog-page">
      <Link className="back-link" href="/"><ArrowLeft size={15} aria-hidden="true" />Inicio</Link>
      <div className="catalog-page-heading"><span className="eyebrow">Tu caja de herramientas</span><h1>{title}</h1><p>{description}</p></div>
      <div className="catalog-search"><SearchForm value={query} /></div>
      <nav className="category-filters" aria-label="Filtrar por categoría"><Link className={!activeCategory ? "filter-chip active" : "filter-chip"} href="/herramientas" aria-current={!activeCategory ? "page" : undefined}>Todas</Link>{categories.map((category) => <Link className={activeCategory === category.slug ? "filter-chip active" : "filter-chip"} href={`/categoria/${category.slug}`} key={category.slug} aria-current={activeCategory === category.slug ? "page" : undefined}>{category.name}</Link>)}</nav>
      <div className="catalog-results-heading"><p><strong>{tools.length}</strong> {tools.length === 1 ? "herramienta disponible" : "herramientas disponibles"}</p><span>Gratis y sin registro</span></div>
      {tools.length ? <ToolGrid tools={tools} /> : <div className="empty-state"><SearchX size={35} strokeWidth={1.5} aria-hidden="true" /><h2>No encontramos esa herramienta</h2><p>Prueba con «porcentajes», «fechas» o «longitud».</p><Link href="/herramientas" className="button button-primary">Ver todas las herramientas</Link></div>}
      <div className="catalog-bottom-note"><span className="status-dot" /><p>Pequeñas soluciones para tus preguntas de cada día.</p></div>
    </div>
  );
}

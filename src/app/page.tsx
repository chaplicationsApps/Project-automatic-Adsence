import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, MoveUpRight, Sparkles } from "lucide-react";
import { getPublishedTools } from "@/lib/catalog";
import { categories } from "@/lib/tools/seeds";
import { SearchForm } from "@/components/search-form";
import { CategoryIcon, ToolGrid } from "@/components/tool-card";
import { ToolCalculator } from "@/components/tool-calculator";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const tools = await getPublishedTools();
  const featured = tools.find((tool) => tool.slug === "calculadora-porcentajes") ?? tools[0];
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <span className="eyebrow hero-eyebrow"><span className="status-dot" />Pequeñas herramientas. Grandes atajos.</span>
          <h1>Menos vueltas.<br />Más <span className="hero-word">claro<span className="hero-word-dot">.</span><svg viewBox="0 0 260 18" fill="none" aria-hidden="true"><path d="M3 12C68 2 171 1 253 8M14 16C92 8 172 8 244 13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg></span></h1>
          <p className="hero-description">Cálculos, fechas y conversiones.<br />Resuelve lo cotidiano y sigue con tu día.</p>
          <SearchForm />
          <div className="hero-benefits"><span><Check size={14} aria-hidden="true" />Gratis</span><span><Check size={14} aria-hidden="true" />Sin registro</span><span><Check size={14} aria-hidden="true" />A tu ritmo</span></div>
        </div>
        {featured ? <div className="hero-demo-wrap"><div className="demo-topline"><span className="demo-label"><Sparkles size={14} aria-hidden="true" />Una pequeña prueba</span><span className="demo-hint">Pruébalo aquí <MoveUpRight size={16} aria-hidden="true" /></span></div><div className="hero-demo"><div className="hero-demo-heading"><span className={`category-icon category-${featured.category}`}><CategoryIcon category={featured.category} size={24} /></span><div><h2>{featured.title}</h2><p>Un resultado en un momento.</p></div></div><ToolCalculator tool={featured} compact /><Link href={`/herramientas/${featured.slug}`} className="demo-full-link">Ver herramienta completa <ArrowUpRight size={14} aria-hidden="true" /></Link></div><p className="demo-caption"><span className="caption-line" />Tú pones los datos. Nosotros lo ponemos fácil.</p></div> : null}
      </section>

      <section className="catalog-section section container" id="herramientas" aria-labelledby="tools-heading">
        <div className="section-heading"><div><span className="eyebrow">Tu caja de herramientas</span><h2 id="tools-heading">Un atajo para cada día.</h2></div><Link className="arrow-link" href="/herramientas">Ver todas las herramientas <ArrowRight size={18} aria-hidden="true" /></Link></div>
        {tools.length ? <ToolGrid tools={tools.slice(0, 3)} /> : <p className="empty-state">Estamos preparando nuevas herramientas. Vuelve pronto.</p>}
      </section>

      <section className="categories-section container" id="categorias" aria-labelledby="categories-heading">
        <div className="categories-intro"><span className="eyebrow">Encuentra lo que necesitas</span><h2 id="categories-heading">Por dónde<br className="desktop-break" /> empezamos.</h2></div>
        <div className="category-list">{categories.map((category) => <Link className="category-row" href={`/categoria/${category.slug}`} key={category.slug}><span className={`category-icon category-${category.slug}`}><CategoryIcon category={category.slug} size={21} /></span><span className="category-row-copy"><strong>{category.name}</strong><span>{category.description}</span></span><ArrowUpRight size={18} aria-hidden="true" /></Link>)}</div>
      </section>

      <section className="how-section" id="como-funciona" aria-labelledby="how-heading">
        <div className="container how-inner"><div className="how-intro"><span className="eyebrow">Sencillo de principio a fin</span><h2 id="how-heading">Menos complicaciones.<br /><em>Más tiempo para ti.</em></h2><p>No todo necesita una hoja de cálculo. A veces, solo hace falta la herramienta adecuada.</p><Link className="arrow-link" href="/legal/metodologia">Así hacemos las cosas <ArrowUpRight size={16} aria-hidden="true" /></Link></div><div className="how-steps"><div className="how-step"><span className="step-number">01</span><div><h3>Encuentra tu herramienta</h3><p>Elige lo que necesitas resolver.</p></div></div><div className="how-step"><span className="step-number">02</span><div><h3>Añade tus datos</h3><p>Campos claros, sin pasos de más.</p></div></div><div className="how-step"><span className="step-number">03</span><div><h3>Llévate la respuesta</h3><p>Un resultado útil y la explicación detrás.</p></div></div></div></div>
      </section>
      <section className="closing-section container"><p>Para los pequeños <em>«¿cuánto era…?»</em> de cada día.</p><Link href="/herramientas" className="circle-link" aria-label="Explorar herramientas"><ArrowDown size={22} aria-hidden="true" /></Link></section>
    </>
  );
}
export const dynamic = "force-dynamic";

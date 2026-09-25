import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, BookOpen, ChevronDown, ChevronRight, Info } from "lucide-react";
import { getPublishedTool, getPublishedTools, getToolIndexable } from "@/lib/catalog";
import { isSiteIndexable } from "@/lib/site";
import { categories } from "@/lib/tools/seeds";
import { CategoryIcon, ToolGrid } from "@/components/tool-card";
import { ToolCalculator } from "@/components/tool-calculator";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [tool, toolIndexable] = await Promise.all([getPublishedTool(slug), getToolIndexable(slug)]);
  if (!tool) return { title: "Herramienta no encontrada", robots: { index: false } };
  return { title: tool.seo.title, description: tool.seo.description, alternates: { canonical: `/herramientas/${slug}` }, openGraph: { title: tool.seo.title, description: tool.seo.description, url: `/herramientas/${slug}` }, robots: { index: isSiteIndexable() && toolIndexable, follow: true } };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const [tool, allTools] = await Promise.all([getPublishedTool(slug), getPublishedTools()]);
  if (!tool) notFound();
  const category = categories.find((item) => item.slug === tool.category);
  const relatedTools = allTools.filter((candidate) => tool.relatedTools.includes(candidate.slug));
  const structuredData = { "@context": "https://schema.org", "@type": "WebApplication", name: tool.title, description: tool.shortDescription, applicationCategory: "UtilitiesApplication", operatingSystem: "Any", browserRequirements: "Requires JavaScript", inLanguage: "es", offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" } };
  return (
    <div className="container tool-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <nav className="breadcrumbs" aria-label="Ruta de navegación"><Link href="/">Inicio</Link><ChevronRight size={12} aria-hidden="true" /><Link href="/herramientas">Herramientas</Link><ChevronRight size={12} aria-hidden="true" /><span>{tool.title}</span></nav>
      <header className="tool-page-heading"><Link className="tool-category-link" href={`/categoria/${tool.category}`}><span className={`category-icon category-${tool.category}`}><CategoryIcon category={tool.category} size={18} /></span>{category?.name ?? tool.category}</Link><h1>{tool.title}</h1><p>{tool.shortDescription}</p></header>
      <ToolCalculator key={tool.slug} tool={tool} />
      <div className="tool-content-layout">
        <div className="tool-content-main">
          <section className="content-section" id="como-usarla"><span className="eyebrow"><BookOpen size={14} aria-hidden="true" />La explicación, sin rodeos</span><h2>Cómo funciona</h2><p>{tool.content.intro}</p><div className="methodology-box"><h3>El cálculo detrás del resultado</h3><p>{tool.content.methodology}</p></div></section>
          <section className="content-section" id="ejemplos"><span className="eyebrow">De la teoría al día a día</span><h2>Unos ejemplos para verlo claro</h2><div className="example-list">{tool.content.examples.map((example, index) => <article className="example-card" key={example.title}><span className="example-number">{String(index + 1).padStart(2, "0")}</span><div><h3>{example.title}</h3><p>{example.description}</p></div></article>)}</div></section>
          <section className="content-section" id="preguntas"><span className="eyebrow">Por si te lo preguntabas</span><h2>Preguntas frecuentes</h2><div className="faq-list">{tool.content.faq.map((item) => <details className="faq-item" key={item.question}><summary>{item.question}<ChevronDown size={18} aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div></section>
        </div>
        <aside className="tool-sidebar"><div className="sidebar-index"><p className="eyebrow">En esta página</p><a href="#como-usarla">Cómo funciona <ArrowRight size={14} aria-hidden="true" /></a><a href="#ejemplos">Ejemplos <ArrowRight size={14} aria-hidden="true" /></a><a href="#preguntas">Preguntas frecuentes <ArrowRight size={14} aria-hidden="true" /></a></div><div className="limitations-box"><Info size={20} aria-hidden="true" /><h3>Ten en cuenta</h3><ul>{tool.content.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></div>{tool.content.sources.length ? <div className="sources-box"><h3>Fuentes y referencias</h3>{tool.content.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<ArrowUpRight size={14} aria-hidden="true" /></a>)}</div> : null}</aside>
      </div>
      {relatedTools.length ? <section className="related-tools"><div className="section-heading"><div><span className="eyebrow">Ya que estás por aquí</span><h2>También te puede ayudar.</h2></div><Link href="/herramientas" className="arrow-link">Ver todas <ArrowRight size={17} aria-hidden="true" /></Link></div><ToolGrid tools={relatedTools} /></section> : null}
    </div>
  );
}
export const dynamic = "force-dynamic";

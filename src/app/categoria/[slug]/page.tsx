import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories } from "@/lib/tools/seeds";
import { getPublishedTools } from "@/lib/catalog";
import { CatalogView } from "@/components/catalog-view";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) return { title: "Categoría no encontrada", robots: { index: false } };
  return { title: category.name, description: category.description, alternates: { canonical: `/categoria/${slug}` } };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const tools = (await getPublishedTools()).filter((tool) => tool.category === slug);
  return <CatalogView title={category.name} description={category.description} tools={tools} activeCategory={slug} />;
}

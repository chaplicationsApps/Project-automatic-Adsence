import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getBaseUrl, isSiteIndexable } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: { default: "Claro · Herramientas para el día a día", template: "%s · Claro" },
  description: "Calcula porcentajes, compara fechas y convierte unidades con herramientas gratuitas, sencillas y con explicaciones claras. Sin registro.",
  openGraph: { siteName: "Claro", locale: "es_ES", type: "website" },
  robots: { index: isSiteIndexable(), follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body><a href="#contenido" className="skip-link">Saltar al contenido</a><SiteHeader /><main id="contenido">{children}</main><SiteFooter /></body></html>;
}

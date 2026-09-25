import Link from "next/link";
import { ArrowUpRight, Asterisk, Search } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Claro, inicio">
          <span className="brand-mark"><Asterisk size={25} strokeWidth={2.2} aria-hidden="true" /></span>
          claro<span className="brand-period">.</span>
        </Link>
        <nav className="main-nav" aria-label="Navegación principal">
          <Link href="/herramientas">Herramientas</Link>
          <Link href="/#categorias">Categorías</Link>
          <Link href="/#como-funciona" className="nav-about">Cómo funciona</Link>
        </nav>
        <Link href="/buscar" className="header-search" aria-label="Buscar herramientas">
          <Search size={18} aria-hidden="true" /><span>Buscar</span><ArrowUpRight size={14} className="search-arrow" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}

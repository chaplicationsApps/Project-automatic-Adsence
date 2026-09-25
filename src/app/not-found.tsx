import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return <div className="container not-found"><span className="eyebrow">Error 404</span><span className="not-found-symbol" aria-hidden="true">?</span><h1>Por aquí no era.</h1><p>Esta página no existe o ya no está disponible.<br />Vamos a encontrar la herramienta que necesitas.</p><div className="not-found-actions"><Link href="/herramientas" className="button button-primary"><Search size={17} aria-hidden="true" />Explorar herramientas</Link><Link href="/" className="button button-secondary"><ArrowLeft size={17} aria-hidden="true" />Volver al inicio</Link></div></div>;
}

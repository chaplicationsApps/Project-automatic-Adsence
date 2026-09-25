import Link from "next/link";
import { Asterisk, ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-intro">
            <Link href="/" className="brand" aria-label="Claro, inicio"><span className="brand-mark"><Asterisk size={25} aria-hidden="true" /></span>claro<span className="brand-period">.</span></Link>
            <p>Una pequeña ayuda.<br />Un día más sencillo.</p>
          </div>
          <div className="footer-column"><p className="footer-heading">Para tu día a día</p><Link href="/herramientas">Todas las herramientas <ArrowUpRight size={13} aria-hidden="true" /></Link><Link href="/categoria/matematicas">Matemáticas</Link><Link href="/categoria/fechas">Fechas y tiempo</Link><Link href="/categoria/conversiones">Conversores</Link></div>
          <div className="footer-column"><p className="footer-heading">El proyecto</p><Link href="/legal/acerca">Acerca de Claro</Link><Link href="/legal/metodologia">Nuestra metodología</Link><Link href="/legal/contacto">Contacto</Link></div>
        </div>
        <div className="footer-bottom"><span>Claro · Herramientas para el día a día</span><nav aria-label="Información legal"><Link href="/legal/privacidad">Privacidad</Link><Link href="/legal/cookies">Cookies</Link><Link href="/legal/terminos">Condiciones de uso</Link></nav></div>
      </div>
    </footer>
  );
}

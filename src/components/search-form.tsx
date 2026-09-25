import { ArrowRight, Search } from "lucide-react";

export function SearchForm({ value = "", compact = false }: { value?: string; compact?: boolean }) {
  return (
    <form action="/buscar" method="get" role="search" className={`search-form${compact ? " search-form-compact" : ""}`}>
      <Search size={20} aria-hidden="true" />
      <label className="sr-only" htmlFor="tool-search">Buscar una herramienta</label>
      <input id="tool-search" name="q" type="search" placeholder="¿Qué necesitas resolver?" defaultValue={value} maxLength={120} />
      <button type="submit" aria-label="Buscar herramientas"><ArrowRight size={21} aria-hidden="true" /></button>
    </form>
  );
}

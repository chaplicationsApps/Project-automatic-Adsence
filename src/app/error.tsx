"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="container" style={{ paddingBlock: "6rem" }}>
    <p className="eyebrow">Un momento</p>
    <h1>No hemos podido cargar esta página.</h1>
    <p>Inténtalo de nuevo dentro de unos instantes.</p>
    <button type="button" className="button button-primary" onClick={reset}>Volver a intentar</button>
  </section>;
}

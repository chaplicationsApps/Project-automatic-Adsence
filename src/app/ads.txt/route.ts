/** Advertising is disabled. Do not publish a placeholder publisher account. */
export function GET() {
  return new Response("# Advertising is not enabled for this site.\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

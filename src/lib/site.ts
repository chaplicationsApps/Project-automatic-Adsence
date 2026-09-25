export function getBaseUrl(): string {
  const configured = process.env.APP_BASE_URL?.trim();
  if (configured) return new URL(configured).origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function isSiteIndexable(): boolean {
  return process.env.SITE_INDEXABLE === "true" && process.env.VERCEL_ENV !== "preview";
}

import type { MetadataRoute } from "next";
import { getBaseUrl, isSiteIndexable } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return isSiteIndexable()
    ? { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/buscar", "/legal"] }, sitemap: `${getBaseUrl()}/sitemap.xml` }
    : { rules: { userAgent: "*", disallow: "/" } };
}

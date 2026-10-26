import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Everything is public, including demos (spec §6: indexable, canonical to
// themselves). Only the API is kept out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

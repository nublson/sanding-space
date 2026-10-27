import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og/image";
import { SITE_NAME } from "@/lib/site";

// The fallback card for routes without an opengraph-image of their own; every
// page in the sidebar has one, so this mostly serves the site root.
export const alt = SITE_NAME;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({ title: "Sand the interface until it feels right" });
}

import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og/image";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

// The default card: every route without an opengraph-image of its own.
export const alt = SITE_NAME;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    eyebrow: "Essays with live demos",
    title: "Sand the interface until it feels right",
    description: SITE_DESCRIPTION,
  });
}

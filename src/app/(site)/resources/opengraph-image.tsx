import { RESOURCES } from "@/lib/content/resources";
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og/image";
import { SITE_NAME } from "@/lib/site";

export const alt = `${RESOURCES.name} · ${SITE_NAME}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// The page's fixed heading.
export default function Image() {
  return ogImage({ title: RESOURCES.name });
}

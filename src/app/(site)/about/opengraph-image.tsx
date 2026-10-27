import { getAbout } from "@/lib/content/notion";
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og/image";
import { SITE_NAME } from "@/lib/site";

export const alt = `About ${SITE_NAME}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// The Notion page's title, as on the page and in its document title.
export default async function Image() {
  const { title } = await getAbout();
  return ogImage({ title });
}

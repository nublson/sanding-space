import { findPublishedEssay } from "@/lib/content/library";
import { getLibrary } from "@/lib/content/notion";
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og/image";
import { SITE_NAME } from "@/lib/site";

export const alt = `An essay on ${SITE_NAME}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// The title alone. The spec's cover-demo screenshot waits for a screenshot
// pipeline; until then the card is typographic.
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = findPublishedEssay(await getLibrary(), slug);
  if (!entry) return ogImage({ title: SITE_NAME });
  return ogImage({ eyebrow: entry.section.name, title: entry.essay.title });
}

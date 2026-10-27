import { getLibrary } from "@/lib/content/notion";
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og/image";
import { SITE_NAME } from "@/lib/site";

export const alt = `A section of ${SITE_NAME}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const section = (await getLibrary()).sections.find((s) => s.slug === slug);
  if (!section) return ogImage({ title: SITE_NAME });
  return ogImage({ eyebrow: section.question, title: section.name });
}

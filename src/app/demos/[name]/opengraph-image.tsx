import { getLibrary } from "@/lib/content/notion";
import { resolveDemo } from "@/lib/demo-meta";
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og/image";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const alt = `An interactive demo from ${SITE_NAME}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const resolved = resolveDemo(name);
  if (resolved.kind !== "demo")
    return ogImage({ title: SITE_NAME, description: SITE_DESCRIPTION });
  const essaySlug = resolved.entry.essay;
  const essay = essaySlug
    ? (await getLibrary()).bySlug.get(essaySlug)?.essay
    : undefined;
  return ogImage({
    eyebrow: "Live demo · Embed it anywhere",
    title: resolved.entry.title,
    description: essay
      ? `From the essay “${essay.title}”. Live, embeddable anywhere on the web.`
      : "Live, embeddable anywhere on the web.",
  });
}

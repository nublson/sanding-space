import { resolveDemo } from "@/lib/demo-meta";
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og/image";
import { SITE_NAME } from "@/lib/site";

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
  return ogImage({
    title: resolved.kind === "demo" ? resolved.entry.title : SITE_NAME,
  });
}

import { findPublishedEssay } from "@/lib/content/library";
import { getLibrary } from "@/lib/content/notion";
import { ogImage } from "@/lib/og/image";

// The library is cached (and revalidated by the Notion webhook); the CDN keeps
// the rendered PNG for a few minutes, like the essay's Open Graph card.
const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=86400";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/story-image/[slug]">,
) {
  const { slug } = await params;
  const entry = findPublishedEssay(await getLibrary(), slug);
  if (!entry) return Response.json({ error: "Not found" }, { status: 404 });
  const image = await ogImage({
    eyebrow: entry.section.name,
    title: entry.essay.title,
    // Nothing prints beside a shared story, unlike a link preview: the
    // summary goes on the image.
    ...(entry.essay.summary && { description: entry.essay.summary }),
    format: "story",
  });
  image.headers.set("Cache-Control", CACHE_CONTROL);
  return image;
}

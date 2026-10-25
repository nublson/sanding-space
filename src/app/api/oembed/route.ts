import { getLibrary } from "@/lib/content/notion";
import type { Library } from "@/lib/content/types";
import { demoMeta } from "@/lib/demo-meta";
import { buildOembed, needsLibrary } from "@/lib/oembed";
import { SITE_URL } from "@/lib/site";

function dimension(v: string | null): number | undefined {
  if (v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const url = params.get("url");
  if (!url) return Response.json({ error: "Missing url" }, { status: 400 });
  try {
    new URL(url);
  } catch {
    return Response.json({ error: "Invalid url" }, { status: 400 });
  }
  const format = params.get("format");
  if (format && format !== "json")
    return Response.json({ error: "Unsupported format" }, { status: 501 });

  // Demo URLs resolve from the in-repo registry; only essay URLs need Notion.
  let library: Library | null = null;
  if (needsLibrary(url, SITE_URL)) {
    try {
      library = await getLibrary();
    } catch {
      return Response.json(
        { error: "Content temporarily unavailable" },
        { status: 503 },
      );
    }
  }
  const result = buildOembed(
    {
      url,
      maxwidth: dimension(params.get("maxwidth")),
      maxheight: dimension(params.get("maxheight")),
    },
    { siteUrl: SITE_URL, demos: demoMeta, library },
  );
  if (!result) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(result);
}

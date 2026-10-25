import { getLibrary } from "@/lib/content/notion";
import { demoMeta } from "@/lib/demo-meta";
import { buildOembed } from "@/lib/oembed";
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

  const library = await getLibrary();
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

import { parseHost } from "@/lib/favicon";

/**
 * GET /api/favicon?host=example.com: the site's favicon, fetched server-side.
 * The site's own /favicon.ico first, then Google's favicon service, which
 * discovers icons declared elsewhere. Cached at the CDN for a day, and served
 * stale for a month while it refreshes; a miss is cached for an hour.
 */
const TIMEOUT_MS = 4000;
const HIT_CACHE =
  "public, max-age=86400, s-maxage=86400, stale-while-revalidate=2592000";
const MISS_CACHE = "public, max-age=3600, s-maxage=3600";

async function fetchIcon(url: string): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "image/*" },
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return null;
    return res;
  } catch {
    return null;
  }
}

export async function GET(request: Request): Promise<Response> {
  const host = parseHost(new URL(request.url).searchParams.get("host"));
  if (!host) return new Response("Expected ?host=example.com", { status: 400 });

  const icon =
    (await fetchIcon(`https://${host}/favicon.ico`)) ??
    (await fetchIcon(
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`,
    ));
  if (!icon) {
    return new Response(null, {
      status: 404,
      headers: { "cache-control": MISS_CACHE },
    });
  }
  return new Response(await icon.arrayBuffer(), {
    headers: {
      "content-type": icon.headers.get("content-type") ?? "image/x-icon",
      "cache-control": HIT_CACHE,
    },
  });
}

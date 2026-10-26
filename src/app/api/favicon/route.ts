import { parseHost } from "@/lib/favicon";

/**
 * GET /api/favicon?host=example.com: the site's favicon, fetched server-side
 * through Google's favicon service only, so this route never connects to an
 * arbitrary host (and cannot be pointed at a private address). Only raster
 * image types pass, and the response is sandboxed, so a remote SVG with a
 * script could never run under this origin. Cached at the CDN for a day and
 * served stale for a month while it refreshes; a miss is cached for an hour.
 */
const TIMEOUT_MS = 4000;
const HIT_CACHE =
  "public, max-age=86400, s-maxage=86400, stale-while-revalidate=2592000";
const MISS_CACHE = "public, max-age=3600, s-maxage=3600";
const RASTER_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);
const SAFE_HEADERS = {
  "content-security-policy": "default-src 'none'; sandbox",
  "x-content-type-options": "nosniff",
};

export async function GET(request: Request): Promise<Response> {
  const host = parseHost(new URL(request.url).searchParams.get("host"));
  if (!host) return new Response("Expected ?host=example.com", { status: 400 });

  const miss = () =>
    new Response(null, {
      status: 404,
      headers: { ...SAFE_HEADERS, "cache-control": MISS_CACHE },
    });

  let icon: Response;
  try {
    icon = await fetch(
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`,
      {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { accept: "image/*" },
      },
    );
  } catch {
    return miss();
  }
  const type = (icon.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (!icon.ok || !RASTER_TYPES.has(type)) return miss();

  return new Response(await icon.arrayBuffer(), {
    headers: {
      ...SAFE_HEADERS,
      "content-type": type,
      "cache-control": HIT_CACHE,
    },
  });
}

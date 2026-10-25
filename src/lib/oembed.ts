import { findPublishedEssay } from "./content/library";
import type { Library } from "./content/types";
import type { DemoMeta } from "./demo-meta";
import { resolveDemoIn } from "./demo-meta";
import { SITE_NAME } from "./site";

export type OembedResponse =
  | {
      version: "1.0";
      type: "rich";
      title: string;
      provider_name: string;
      provider_url: string;
      width: number;
      height: number;
      html: string;
    }
  | {
      version: "1.0";
      type: "link";
      title: string;
      provider_name: string;
      provider_url: string;
    };

const DEFAULT_WIDTH = 640;

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function richFor(
  name: string,
  entry: DemoMeta,
  title: string,
  input: { maxwidth?: number; maxheight?: number },
  siteUrl: string,
  /** The requested demo URL's query (e.g. "?scale=0.5"), kept on the iframe. */
  query = "",
): OembedResponse {
  const limit = (max?: number) =>
    max !== undefined && Number.isFinite(max) && max > 0 ? max : undefined;
  const maxwidth = limit(input.maxwidth);
  const maxheight = limit(input.maxheight);
  const width = maxwidth ? Math.min(DEFAULT_WIDTH, maxwidth) : DEFAULT_WIDTH;
  const height = maxheight ? Math.min(entry.height, maxheight) : entry.height;
  const frameTitle = escapeAttr(`${entry.title} · ${SITE_NAME}`);
  const src = escapeAttr(`${siteUrl}/demos/${name}${query}`);
  // Limits apply to the iframe itself; embed.js honors the max height on resize.
  const maxWidthStyle = maxwidth ? `;max-width:${width}px` : "";
  const maxHeightAttr = maxheight ? ` data-sanding-max-height="${height}"` : "";
  const html =
    `<iframe src="${src}"\n` +
    `  data-sanding${maxHeightAttr} loading="lazy" style="width:100%${maxWidthStyle};height:${height}px;border:0"\n` +
    `  title="${frameTitle}"></iframe>\n` +
    `<script async src="${siteUrl}/embed.js"></script>`;
  return {
    version: "1.0",
    type: "rich",
    title,
    provider_name: SITE_NAME,
    provider_url: siteUrl,
    width,
    height,
    html,
  };
}

/**
 * Path segments of `url` when it is on this site, else null. A single segment
 * is an essay URL, the only kind that needs the Notion library.
 */
export function oembedSegments(url: string, siteUrl: string): string[] | null {
  let parsed: URL;
  let site: URL;
  try {
    parsed = new URL(url);
    site = new URL(siteUrl);
  } catch {
    return null;
  }
  if (parsed.origin !== site.origin) return null;
  return parsed.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
}

export function needsLibrary(url: string, siteUrl: string): boolean {
  return oembedSegments(url, siteUrl)?.length === 1;
}

export function buildOembed(
  input: { url: string; maxwidth?: number; maxheight?: number },
  ctx: {
    siteUrl: string;
    demos: Record<string, DemoMeta>;
    /** Only needed for essay URLs; null means essays resolve to nothing. */
    library: Library | null;
  },
): OembedResponse | null {
  const segments = oembedSegments(input.url, ctx.siteUrl);
  if (!segments) return null;

  const demo = (name: string, title?: string, query?: string) => {
    let resolved = resolveDemoIn(ctx.demos, name);
    if (resolved.kind === "alias")
      resolved = resolveDemoIn(ctx.demos, resolved.target);
    if (resolved.kind !== "demo") return null;
    return richFor(
      resolved.name,
      resolved.entry,
      title ?? resolved.entry.title,
      input,
      ctx.siteUrl,
      query,
    );
  };

  if (segments[0] === "demos" && segments.length === 2) {
    try {
      return demo(
        decodeURIComponent(segments[1]),
        undefined,
        new URL(input.url).search,
      );
    } catch {
      return null;
    }
  }
  if (segments.length === 1) {
    if (!ctx.library) return null;
    const found = findPublishedEssay(ctx.library, segments[0]);
    if (!found) return null;
    const { essay } = found;
    if (essay.coverDemo) {
      const rich = demo(essay.coverDemo, essay.title);
      if (rich) return rich;
    }
    return {
      version: "1.0",
      type: "link",
      title: essay.title,
      provider_name: SITE_NAME,
      provider_url: ctx.siteUrl,
    };
  }
  return null;
}

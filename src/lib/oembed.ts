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

function richFor(
  name: string,
  entry: DemoMeta,
  title: string,
  input: { maxwidth?: number; maxheight?: number },
  siteUrl: string,
): OembedResponse {
  const clamp = (v: number, max?: number) =>
    max !== undefined && Number.isFinite(max) && max > 0 ? Math.min(v, max) : v;
  const width = clamp(DEFAULT_WIDTH, input.maxwidth);
  const height = clamp(entry.height, input.maxheight);
  const frameTitle = `${entry.title} · ${SITE_NAME}`;
  const html =
    `<iframe src="${siteUrl}/demos/${name}"\n` +
    `  data-sanding loading="lazy" style="width:100%;height:${height}px;border:0"\n` +
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

export function buildOembed(
  input: { url: string; maxwidth?: number; maxheight?: number },
  ctx: { siteUrl: string; demos: Record<string, DemoMeta>; library: Library },
): OembedResponse | null {
  let url: URL;
  let site: URL;
  try {
    url = new URL(input.url);
    site = new URL(ctx.siteUrl);
  } catch {
    return null;
  }
  if (url.origin !== site.origin) return null;
  const path = url.pathname.replace(/\/+$/, "");
  const segments = path.split("/").filter(Boolean);

  const demo = (name: string, title?: string) => {
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
    );
  };

  if (segments[0] === "demos" && segments.length === 2) {
    try {
      return demo(decodeURIComponent(segments[1]));
    } catch {
      return null;
    }
  }
  if (segments.length === 1) {
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

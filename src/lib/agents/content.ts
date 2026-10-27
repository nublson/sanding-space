import { findPublishedEssay } from "../content/library";
import { pageHref } from "../content/links";
import {
  getBlocks,
  getLibrary,
  getPage,
  getResources,
} from "../content/notion";
import { RESOURCES } from "../content/resources";
import type { Library } from "../content/types";
import { demoMeta } from "../demo-meta";
import { buildOembed } from "../oembed";
import { absoluteUrl, SITE_URL } from "../site";
import { ABOUT, INTRODUCTION } from "../standalone";
import {
  essayMarkdown,
  resourcesMarkdown,
  sectionMarkdown,
  standaloneMarkdown,
} from "./markdown";

/**
 * What every agent surface reads (Markdown negotiation, MCP, A2A): the same
 * cached Notion data the HTML pages use, so the protocols tell one story.
 */

export type EssayItem = {
  slug: string;
  title: string;
  summary: string;
  section: string;
  status: "Published" | "Soon";
  /** Absolute URL; null while the essay is coming soon. */
  url: string | null;
  demo: string | null;
  published: string | null;
};

export type DemoItem = {
  name: string;
  title: string;
  url: string;
  essayUrl: string | null;
  embedHtml: string;
};

const SECTION_PATH = /^sections\/([^/]+)$/;
const SLUG_PATH = /^[^/.]+$/;

/**
 * A page as Markdown, by its path without the leading slash ("introduction",
 * "sections/motion", "button-press"); null when no such page exists.
 */
export async function pageMarkdown(path: string): Promise<string | null> {
  const library = await getLibrary();
  const href = pageHref(library);

  for (const page of [INTRODUCTION, ABOUT]) {
    if (path === page.path.slice(1)) {
      const { title, blocks } = await getPage(page);
      return standaloneMarkdown({ title, blocks, pageHref: href });
    }
  }
  if (path === RESOURCES.path.slice(1)) {
    return resourcesMarkdown(await getResources());
  }

  const sectionSlug = SECTION_PATH.exec(path)?.[1];
  if (sectionSlug) {
    const section = library.sections.find((s) => s.slug === sectionSlug);
    if (!section) return null;
    const blocks = await getBlocks(section.id);
    return sectionMarkdown({ section, blocks, pageHref: href });
  }

  if (!SLUG_PATH.test(path)) return null;
  const entry = findPublishedEssay(library, path);
  if (!entry) return null;
  const blocks = await getBlocks(entry.essay.id);
  return essayMarkdown({ ...entry, blocks, pageHref: href });
}

export function essayItems(library: Library): EssayItem[] {
  return library.sections.flatMap((section) =>
    section.essays.map((essay) => ({
      slug: essay.slug,
      title: essay.title,
      summary: essay.summary,
      section: section.name,
      status: essay.status === "Published" ? "Published" : "Soon",
      url: essay.status === "Published" ? absoluteUrl(`/${essay.slug}`) : null,
      demo: essay.coverDemo,
      published: essay.published,
    })),
  );
}

export async function listEssays(): Promise<EssayItem[]> {
  return essayItems(await getLibrary());
}

/** Case-insensitive match on title, summary and section name. */
export function searchEssayItems(
  items: EssayItem[],
  query: string,
): EssayItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return items.filter((item) =>
    [item.title, item.summary, item.section].some((field) =>
      field.toLowerCase().includes(needle),
    ),
  );
}

export async function searchEssays(query: string): Promise<EssayItem[]> {
  return searchEssayItems(await listEssays(), query);
}

/** Live demos from the registry, each with its embed code (the oEmbed HTML). */
export function demoItems(library: Library | null): DemoItem[] {
  const essayByDemo = new Map<string, string>();
  for (const section of library?.sections ?? [])
    for (const essay of section.essays)
      if (essay.status === "Published" && essay.coverDemo)
        essayByDemo.set(essay.coverDemo, absoluteUrl(`/${essay.slug}`));

  return Object.entries(demoMeta)
    .filter(([, meta]) => !meta.retired)
    .map(([name, meta]) => {
      const url = absoluteUrl(`/demos/${name}`);
      const oembed = buildOembed(
        { url },
        { siteUrl: SITE_URL, demos: demoMeta, library: null },
      );
      return {
        name,
        title: meta.title,
        url,
        essayUrl:
          essayByDemo.get(name) ??
          (meta.essay ? absoluteUrl(`/${meta.essay}`) : null),
        embedHtml: oembed && oembed.type === "rich" ? oembed.html : "",
      };
    });
}

export async function listDemos(): Promise<DemoItem[]> {
  return demoItems(await getLibrary());
}

export async function listResources() {
  return (await getResources()).categories.map((category) => ({
    category: category.name,
    resources: category.resources.map(({ name, url, description }) => ({
      name,
      url,
      description,
    })),
  }));
}

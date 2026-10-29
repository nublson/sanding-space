import { Client, isFullDataSource } from "@notionhq/client";
import { cacheLife, cacheTag } from "next/cache";
import type { NotionBlock } from "notionic";
import {
  type FetchBlocksOptions,
  fetchBlocks,
  fetchLinkFavicon,
  fetchPage,
  type LinkFaviconOptions,
} from "notionic/fetch";
import { hostOf } from "../favicon";
import { showPreviews } from "../site";
import {
  ABOUT,
  INTRODUCTION,
  type StandalonePage,
  standalonePageId,
} from "../standalone";
import { buildLibrary, resolvePreview } from "./library";
import {
  parseEssay,
  parseResource,
  parseResourcesSchema,
  parseSection,
} from "./parse";
import { queryAll } from "./query";
import { buildResources, type Resources } from "./resources";
import type { Library } from "./types";

export { queryAll } from "./query";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

function client(): Client {
  return new Client({ auth: env("NOTION_TOKEN") });
}

/**
 * Links to other sites carry the site's favicon: notionic looks each host up
 * once per fetch and inlines the icon as a data URL, so it is cached with the
 * blocks and the page renders without a request per link.
 *
 * `siteIcons` takes the icon each site declares on its home page (SVG, else
 * the smallest PNG of 32px or more, else /favicon.ico) before Google's and
 * DuckDuckGo's copies, which can be stale or re-encoded. It means fetching
 * URLs the linked sites choose; notionic refuses private addresses, and the
 * site runs on Vercel functions with no private network to reach.
 */
const LINK_FAVICONS: LinkFaviconOptions = { siteIcons: true };
const FETCH_OPTIONS: FetchBlocksOptions = { linkFavicons: LINK_FAVICONS };

export async function getLibrary(): Promise<Library> {
  "use cache";
  cacheTag("notion");
  cacheLife("minutes");
  const notion = client();
  const [sections, essays] = await Promise.all([
    queryAll(notion, env("NOTION_SECTIONS_DATA_SOURCE_ID")),
    queryAll(notion, env("NOTION_ESSAYS_DATA_SOURCE_ID")),
  ]);
  return buildLibrary(
    sections.map(parseSection),
    resolvePreview(essays.map(parseEssay), showPreviews()),
  );
}

/** The Resources page: the database's description and Category options, and its rows. */
export async function getResources(): Promise<Resources> {
  "use cache";
  cacheTag("notion");
  cacheLife("minutes");
  const notion = client();
  const id = env("NOTION_RESOURCES_DATA_SOURCE_ID");
  const [dataSource, rows] = await Promise.all([
    notion.dataSources.retrieve({ data_source_id: id }),
    queryAll(notion, id),
  ]);
  if (!isFullDataSource(dataSource)) {
    throw new Error("Resources data source is not fully readable");
  }
  return withFavicons(
    buildResources(parseResourcesSchema(dataSource), rows.map(parseResource)),
  );
}

/**
 * Each resource with its site's own icon, looked up once per host the same
 * way as link favicons in essays, and cached with the resources.
 */
async function withFavicons(resources: Resources): Promise<Resources> {
  const hosts = new Set(
    resources.categories.flatMap((c) =>
      c.resources.flatMap((r) => hostOf(r.url) ?? []),
    ),
  );
  const icons = new Map(
    await Promise.all(
      [...hosts].map(
        async (host) =>
          [
            host,
            await fetchLinkFavicon(host, LINK_FAVICONS).catch(() => null),
          ] as const,
      ),
    ),
  );
  return {
    ...resources,
    categories: resources.categories.map((category) => ({
      ...category,
      resources: category.resources.map((resource) => ({
        ...resource,
        favicon: icons.get(hostOf(resource.url) ?? "") ?? null,
      })),
    })),
  };
}

export type StandalonePageContent = {
  title: string;
  lastEditedTime: string;
  blocks: NotionBlock[];
};

/** A standalone page (Introduction, About): its Notion title, last edit and blocks. */
export async function getStandalonePage(
  pageId: string,
): Promise<StandalonePageContent> {
  "use cache";
  cacheTag("notion");
  cacheLife("minutes");
  const { page, blocks } = await fetchPage(client(), pageId, FETCH_OPTIONS);
  return { title: page.title, lastEditedTime: page.lastEditedTime, blocks };
}

export function getIntroduction(): Promise<StandalonePageContent> {
  return getStandalonePage(standalonePageId(INTRODUCTION));
}

export function getAbout(): Promise<StandalonePageContent> {
  return getStandalonePage(standalonePageId(ABOUT));
}

export function getPage(page: StandalonePage): Promise<StandalonePageContent> {
  return getStandalonePage(standalonePageId(page));
}

export async function getBlocks(pageId: string): Promise<NotionBlock[]> {
  "use cache";
  cacheTag("notion");
  cacheLife("minutes");
  return fetchBlocks(client(), pageId, FETCH_OPTIONS);
}

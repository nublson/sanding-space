import { Client } from "@notionhq/client";
import { cacheLife, cacheTag } from "next/cache";
import type { NotionBlock } from "notionic";
import {
  type FetchBlocksOptions,
  fetchBlocks,
  fetchPage,
} from "notionic/fetch";
import { showPreviews } from "../site";
import {
  ABOUT,
  INTRODUCTION,
  type StandalonePage,
  standalonePageId,
} from "../standalone";
import { buildLibrary, resolvePreview } from "./library";
import { parseEssay, parseSection } from "./parse";
import { queryAll } from "./query";
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
 */
const FETCH_OPTIONS: FetchBlocksOptions = { linkFavicons: true };

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

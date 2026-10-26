import { Client, isFullDataSource } from "@notionhq/client";
import { cacheLife, cacheTag } from "next/cache";
import type { NotionBlock } from "notionic";
import { fetchBlocks, fetchPage } from "notionic/fetch";
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
  return buildResources(
    parseResourcesSchema(dataSource),
    rows.map(parseResource),
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
  const { page, blocks } = await fetchPage(client(), pageId);
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
  return fetchBlocks(client(), pageId);
}

import { Client } from "@notionhq/client";
import { cacheLife, cacheTag } from "next/cache";
import type { NotionBlock, NotionPage } from "notionic";
import { fetchBlocks, fetchPage } from "notionic/fetch";
import { showPreviews } from "../site";
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

export async function getBlocks(pageId: string): Promise<NotionBlock[]> {
  "use cache";
  cacheTag("notion");
  cacheLife("minutes");
  return fetchBlocks(client(), pageId);
}

/** A standalone page's metadata (title, icon…) and its blocks. */
export async function getPage(
  pageId: string,
): Promise<{ page: NotionPage; blocks: NotionBlock[] }> {
  "use cache";
  cacheTag("notion");
  cacheLife("minutes");
  return fetchPage(client(), pageId);
}

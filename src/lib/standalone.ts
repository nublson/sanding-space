import { normalizePageId } from "notionic";

/**
 * The two standalone Notion pages: the Introduction (the site's default page,
 * "/" redirects there) and About (the colophon, linked from the sidebar
 * footer). Their sidebar labels and paths are fixed; content, heading and
 * document title come from the Notion page named by the env var.
 */
export type StandalonePage = {
  readonly name: string;
  readonly path: string;
  readonly envVar: string;
};

export const INTRODUCTION: StandalonePage = {
  name: "Introduction",
  path: "/introduction",
  envVar: "NOTION_INTRODUCTION_PAGE_ID",
};

export const ABOUT: StandalonePage = {
  name: "About",
  path: "/about",
  envVar: "NOTION_ABOUT_PAGE_ID",
};

export const STANDALONE_PAGES = [INTRODUCTION, ABOUT] as const;

export function standalonePageId(
  page: StandalonePage,
  env: Record<string, string | undefined> = process.env,
): string {
  const id = env[page.envVar];
  if (!id) throw new Error(`Missing env ${page.envVar}`);
  return normalizePageId(id);
}

import { normalizePageId } from "notionic";

/**
 * The Introduction is the site's default page ("/" redirects here). Its
 * sidebar label and path are fixed; its content, heading and title come from a
 * standalone Notion page whose id is NOTION_INTRODUCTION_PAGE_ID.
 */
export const INTRODUCTION = {
  name: "Introduction",
  path: "/introduction",
} as const;

export function introductionPageId(
  env: Record<string, string | undefined> = process.env,
): string {
  const id = env.NOTION_INTRODUCTION_PAGE_ID;
  if (!id) throw new Error("Missing env NOTION_INTRODUCTION_PAGE_ID");
  return normalizePageId(id);
}

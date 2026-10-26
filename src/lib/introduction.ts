import { normalizePageId } from "notionic";

/**
 * The Introduction is the site's default page ("/" redirects here). Its name
 * and path are fixed; its content is a standalone Notion page.
 */
export const INTRODUCTION = {
  name: "Introduction",
  path: "/introduction",
  pageId: normalizePageId("405b1726-8ab3-81f0-9d46-ef735904da9e"),
} as const;

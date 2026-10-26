import type { NotionBlock } from "notionic";

export function withoutDatabases(blocks: NotionBlock[]): NotionBlock[] {
  return blocks.filter((b) => {
    if (b.type === "child_database" || b.type === "unsupported") return false;
    if (b.type === "link_to_page" && b.link_to_page.type === "database_id")
      return false;
    return true;
  });
}

const DEMO_PATH = /\/demos\/([^/?#]+)\/?(?:[?#]|$)/;

export function demoEmbeds(blocks: NotionBlock[]): string[] {
  const names: string[] = [];
  for (const block of blocks) {
    if (block.type === "embed") {
      const match = DEMO_PATH.exec(block.embed.url);
      if (match) names.push(decodeURIComponent(match[1]));
    }
    if (block.children?.length) names.push(...demoEmbeds(block.children));
  }
  return names;
}

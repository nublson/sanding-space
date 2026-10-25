import { Client } from "@notionhq/client";
import { fetchBlocks } from "notionic/fetch";
import { checkContent } from "@/lib/check-content";
import { demoEmbeds } from "@/lib/content/blocks";
import { parseEssay, parseSection } from "@/lib/content/parse";
import { queryAll } from "@/lib/content/query";
import { demoMeta } from "@/lib/demo-meta";

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing env ${name}`);
    process.exit(1);
  }
  return value;
}

async function main() {
  const notion = new Client({ auth: env("NOTION_TOKEN") });
  const [sectionPages, essayPages] = await Promise.all([
    queryAll(notion, env("NOTION_SECTIONS_DATA_SOURCE_ID")),
    queryAll(notion, env("NOTION_ESSAYS_DATA_SOURCE_ID")),
  ]);
  const sections = sectionPages.map(parseSection);
  const essays = essayPages.map(parseEssay);

  const embedsByEssay: Record<string, string[]> = {};
  await Promise.all(
    essays
      .filter((e) => e.status !== "Draft")
      .map(async (e) => {
        const blocks = await fetchBlocks(notion, e.id, {
          bookmarkPreviews: false,
        });
        embedsByEssay[e.id] = demoEmbeds(blocks);
      }),
  );

  const { errors, warnings } = checkContent({
    sections,
    essays,
    embedsByEssay,
    demos: demoMeta,
  });
  for (const w of warnings) console.warn(`warning: ${w}`);
  for (const e of errors) console.error(`error: ${e}`);
  if (errors.length > 0) {
    console.error(`\ncheck:content failed with ${errors.length} error(s)`);
    process.exit(1);
  }
  console.log(
    `check:content ok (${essays.length} essays, ${sections.length} sections, ${warnings.length} warning(s))`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

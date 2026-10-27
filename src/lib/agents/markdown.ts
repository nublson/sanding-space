import type { NotionBlock } from "notionic";
import { blocksToMarkdown } from "notionic/markdown";
import { withoutDatabases } from "../content/blocks";
import type { Resources } from "../content/resources";
import type { Essay, LibrarySection } from "../content/types";
import { AUTHOR, absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "../site";

/**
 * Pages as Markdown for agents: the same content the HTML pages render, with
 * every link absolute so the text works off-site. Notion's heading 1 becomes
 * `##` (notionic), so the page title is the only `#`.
 */

export type PageHref = (pageId: string) => string | null;

function body(blocks: NotionBlock[], pageHref: PageHref): string {
  return blocksToMarkdown(withoutDatabases(blocks), {
    pageHref: (id) => {
      const path = pageHref(id);
      return path === null ? null : absoluteUrl(path);
    },
  }).trim();
}

/** Always quoted, so a title like `null` or `2026` stays a string. */
function yaml(value: string): string {
  return JSON.stringify(value);
}

function frontMatter(fields: Record<string, string | null | undefined>) {
  const lines = Object.entries(fields)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([key, value]) => `${key}: ${yaml(value)}`);
  return ["---", ...lines, "---"].join("\n");
}

function join(parts: (string | false | null | undefined)[]): string {
  return `${parts.filter(Boolean).join("\n\n")}\n`;
}

/** One list line for an essay: a link when Published, plain "(coming soon)" text when Soon. */
export function essayLine(essay: Essay): string {
  const summary = essay.summary ? `: ${essay.summary}` : "";
  return essay.status === "Published"
    ? `- [${essay.title}](${absoluteUrl(`/${essay.slug}`)})${summary}`
    : `- ${essay.title} (coming soon)${summary}`;
}

export function essayMarkdown({
  essay,
  section,
  blocks,
  pageHref,
}: {
  essay: Essay;
  section: LibrarySection;
  blocks: NotionBlock[];
  pageHref: PageHref;
}): string {
  return join([
    frontMatter({
      title: essay.title,
      description: essay.summary,
      section: section.name,
      url: absoluteUrl(`/${essay.slug}`),
      published: essay.published,
      updated: essay.updated,
      author: AUTHOR.name,
    }),
    `# ${essay.title}`,
    essay.summary && `> ${essay.summary}`,
    essay.coverDemo &&
      `Demo: ${absoluteUrl(`/demos/${encodeURIComponent(essay.coverDemo)}`)}`,
    body(blocks, pageHref),
  ]);
}

export function sectionMarkdown({
  section,
  blocks,
  pageHref,
}: {
  section: LibrarySection;
  blocks: NotionBlock[];
  pageHref: PageHref;
}): string {
  return join([
    `# ${section.name}`,
    section.question && `> ${section.question}`,
    body(blocks, pageHref),
    "## Essays",
    section.essays.map(essayLine).join("\n"),
  ]);
}

/** A standalone page (Introduction, About): its Notion title and body. */
export function standaloneMarkdown({
  title,
  blocks,
  pageHref,
}: {
  title: string;
  blocks: NotionBlock[];
  pageHref: PageHref;
}): string {
  return join([`# ${title}`, body(blocks, pageHref)]);
}

export function resourcesMarkdown(resources: Resources): string {
  return join([
    "# Resources",
    resources.intro && `> ${resources.intro}`,
    ...resources.categories.flatMap((category) => [
      `## ${category.name}`,
      category.resources
        .map((r) => {
          const description = r.description ? `: ${r.description}` : "";
          return `- [${r.name}](${r.url})${description}`;
        })
        .join("\n"),
    ]),
  ]);
}

/**
 * /llms.txt (llmstxt.org): the library at a glance, every section with its
 * essays, then the fixed pages and the ways to read the site as an agent.
 */
export function llmsTxt(sections: LibrarySection[]): string {
  return join([
    `# ${SITE_NAME}`,
    `> ${SITE_DESCRIPTION}`,
    [
      "Every essay has live, interactive demos; each demo has a permanent, embeddable URL under /demos/.",
      "Request any page with `Accept: text/markdown` to get it as Markdown.",
    ].join(" "),
    ...sections.flatMap((section) => [
      `## ${section.name}`,
      section.question,
      [
        `- [${section.name}](${absoluteUrl(`/sections/${section.slug}`)}): the section's introduction`,
        ...section.essays.map(essayLine),
      ].join("\n"),
    ]),
    "## Pages",
    [
      `- [Introduction](${absoluteUrl("/introduction")}): what the library is and how to read it`,
      `- [Resources](${absoluteUrl("/resources")}): tools and references by category`,
      `- [About](${absoluteUrl("/about")}): who makes the site, how it is built, what you may do with the demos`,
    ].join("\n"),
    "## Optional",
    [
      `- [MCP server](${absoluteUrl("/api/mcp")}): read-only tools to list, search and read essays, demos and resources`,
      `- [Agent skill](${absoluteUrl("/.well-known/agent-skills/sanding-space/SKILL.md")}): how to read and embed Sanding Space as an agent`,
      `- [oEmbed](${absoluteUrl("/api/oembed")}): embed codes for essays and demos`,
    ].join("\n"),
  ]);
}

/** A rough size for the `x-markdown-tokens` header: about four characters per token. */
export function estimateTokens(markdown: string): number {
  return Math.ceil(markdown.length / 4);
}

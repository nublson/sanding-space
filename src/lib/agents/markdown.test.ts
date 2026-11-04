import type { NotionBlock } from "notionic";
import type { Essay, LibrarySection } from "../content/types";
import { AUTHOR, absoluteUrl } from "../site";
import {
  APPLY_HEADING,
  APPLY_INTRO,
  essayLine,
  essayMarkdown,
  estimateTokens,
  llmsTxt,
  resourcesMarkdown,
  sectionMarkdown,
} from "./markdown";

const b = (o: Record<string, unknown>) => o as unknown as NotionBlock;
const para = (t: string) =>
  b({
    type: "paragraph",
    paragraph: {
      rich_text: [
        {
          type: "text",
          plain_text: t,
          text: { content: t, link: null },
          href: null,
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: "default",
          },
        },
      ],
    },
  });
const pageLink = (id: string, title: string) =>
  b({
    type: "link_to_page",
    link_to_page: { type: "page_id", page_id: id },
    linkedPage: { id, title },
  });

const essay = (o: Partial<Essay> = {}): Essay => ({
  id: "e",
  slug: "button-press",
  title: "Button Press",
  summary: "Why buttons sink.",
  status: "Published",
  order: 1,
  sectionId: "s",
  coverDemo: "surface",
  apply: null,
  tags: [],
  published: "2026-01-01",
  updated: "2026-02-01",
  relatedIds: [],
  ...o,
});

const section = (essays: Essay[]): LibrarySection => ({
  id: "s",
  slug: "interaction",
  name: "Interaction",
  question: "How should it feel?",
  order: 1,
  visible: true,
  essays,
});

describe("essayLine", () => {
  it("links Published essays and marks Soon ones without a link", () => {
    expect(essayLine(essay())).toMatch(
      /^- \[Button Press\]\(https?:\/\/[^)]+\/button-press\): Why buttons sink\.$/,
    );
    expect(essayLine(essay({ status: "Soon", summary: "" }))).toBe(
      "- Button Press (coming soon)",
    );
  });
});

describe("essayMarkdown", () => {
  it("has front matter, one H1, the demo and a body with absolute page links", () => {
    const md = essayMarkdown({
      essay: essay({ title: "Press: a study" }),
      section: section([]),
      blocks: [para("Hello."), pageLink("p2", "Hover")],
      pageHref: (id) => (id === "p2" ? "/hover" : null),
    });
    expect(md.startsWith('---\ntitle: "Press: a study"\n')).toBe(true);
    expect(md).toContain('section: "Interaction"\n');
    expect(md.match(/^# /gm)).toHaveLength(1);
    expect(md).toContain("# Press: a study");
    expect(md).toMatch(/Demo: https?:\/\/[^/]+\/demos\/surface/);
    expect(md).toContain("Hello.");
    expect(md).toMatch(/\[Hover\]\(https?:\/\/[^/]+\/hover\)/);
  });
});

describe("essayMarkdown Apply brief", () => {
  const render = (apply: string | null) =>
    essayMarkdown({
      essay: essay({ apply }),
      section: section([]),
      blocks: [para("Hello.")],
      pageHref: () => null,
    });

  it("leaves an essay without a brief unchanged", () => {
    expect(render(null)).toBe(
      [
        "---",
        'title: "Button Press"',
        'description: "Why buttons sink."',
        'section: "Interaction"',
        `url: "${absoluteUrl("/button-press")}"`,
        'published: "2026-01-01"',
        'updated: "2026-02-01"',
        `author: "${AUTHOR.name}"`,
        "---",
        "",
        "# Button Press",
        "",
        "> Why buttons sink.",
        "",
        `Demo: ${absoluteUrl("/demos/surface")}`,
        "",
        "Hello.",
        "",
      ].join("\n"),
    );
  });

  it("leads with the Apply brief, then the essay", () => {
    const md = render("- Scale to 0.97.");
    const order = [
      "> Why buttons sink.",
      `## ${APPLY_HEADING}`,
      APPLY_INTRO,
      "- Scale to 0.97.",
      "## Essay",
      "Demo: ",
      "Hello.",
    ].map((part) => md.indexOf(part));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(md.match(/^# /gm)).toHaveLength(1);
  });

  it("leaves the brief out with apply: false, the page as a reader copies it", () => {
    const md = essayMarkdown({
      essay: essay({ apply: "- Scale to 0.97." }),
      section: section([]),
      blocks: [para("Hello.")],
      pageHref: () => null,
      apply: false,
    });
    expect(md).toBe(render(null));
  });

  it("demotes headings inside the brief", () => {
    const md = render("# Rules\n## Look for\n### Fine");
    for (const line of ["### Rules", "### Look for", "### Fine"])
      expect(md).toContain(`\n${line}\n`);
    expect(md.match(/^# /gm)).toHaveLength(1);
    expect(md.match(/^## .*$/gm)).toEqual([`## ${APPLY_HEADING}`, "## Essay"]);
  });
});

test("front matter keeps YAML-looking titles as strings", () => {
  const md = essayMarkdown({
    essay: essay({ title: "null", summary: "123" }),
    section: section([]),
    blocks: [],
    pageHref: () => null,
  });
  expect(md).toContain('title: "null"\ndescription: "123"\n');
});

describe("sectionMarkdown", () => {
  it("lists its essays after the intro and drops the linked database", () => {
    const md = sectionMarkdown({
      section: section([
        essay(),
        essay({ slug: "later", title: "Later", status: "Soon" }),
      ]),
      blocks: [
        para("Intro."),
        b({ type: "child_database", child_database: { title: "Essays" } }),
      ],
      pageHref: () => null,
    });
    expect(md).toContain("# Interaction\n\n> How should it feel?\n\nIntro.");
    expect(md).toContain("## Essays");
    expect(md).toContain("- Later (coming soon)");
    expect(md).not.toContain("Essays](");
  });
});

test("resourcesMarkdown groups resources under category headings", () => {
  const md = resourcesMarkdown({
    intro: "Tools we use.",
    categories: [
      {
        id: "type",
        name: "Type",
        resources: [
          {
            id: "r",
            name: "Inter",
            url: "https://rsms.me/inter",
            description: "A typeface.",
            order: 1,
          },
        ],
      },
    ],
  });
  expect(md).toBe(
    "# Resources\n\n> Tools we use.\n\n## Type\n\n- [Inter](https://rsms.me/inter): A typeface.\n",
  );
});

test("llmsTxt lists sections with their essays, the fixed pages and the agent surfaces", () => {
  const txt = llmsTxt([section([essay()])]);
  expect(txt.startsWith("# Sanding Space\n\n> ")).toBe(true);
  expect(txt).toContain(
    "## Interaction\n\nHow should it feel?\n\n- [Interaction](",
  );
  expect(txt).toContain("- [Button Press](");
  for (const heading of ["## Pages", "## Optional"])
    expect(txt).toContain(heading);
  expect(txt).toEqual(expect.stringContaining("/api/mcp"));
  expect(txt).toContain("Apply this to your code");
  expect(txt).toMatch(/\[Introduction\]\(https?:\/\/[^)]+\/introduction\)/);
});

test("estimateTokens is about a quarter of the length", () => {
  expect(estimateTokens("x".repeat(10))).toBe(3);
});

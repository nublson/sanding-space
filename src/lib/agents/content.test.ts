import type { Essay, Library } from "../content/types";
import { demoItems, essayItems, searchEssayItems } from "./content";

const essay = (o: Partial<Essay>): Essay => ({
  id: "e",
  slug: "button-press",
  title: "Button Press",
  summary: "Why buttons sink.",
  status: "Published",
  order: 1,
  sectionId: "s",
  coverDemo: "surface",
  tags: [],
  published: null,
  updated: "2026-02-01",
  relatedIds: [],
  ...o,
});

const library = {
  sections: [
    {
      id: "s",
      slug: "interaction",
      name: "Interaction",
      question: "",
      order: 1,
      visible: true,
      essays: [
        essay({}),
        essay({
          slug: "later",
          title: "Later",
          summary: "",
          status: "Soon",
          coverDemo: null,
        }),
      ],
    },
  ],
  bySlug: new Map(),
} as Library;

test("essay items give Published essays a URL and Soon ones none", () => {
  const items = essayItems(library);
  expect(items.map((i) => [i.slug, i.status, i.url !== null])).toEqual([
    ["button-press", "Published", true],
    ["later", "Soon", false],
  ]);
});

test("search matches title, summary and section, ignoring case", () => {
  const items = essayItems(library);
  expect(searchEssayItems(items, "SINK").map((i) => i.slug)).toEqual([
    "button-press",
  ]);
  expect(searchEssayItems(items, "interaction")).toHaveLength(2);
  expect(searchEssayItems(items, "  ")).toEqual([]);
});

test("demos carry their essay and embed code", () => {
  const surface = demoItems(library).find((d) => d.name === "surface");
  if (!surface) throw new Error("surface demo missing");
  expect(surface.essayUrl).toMatch(/\/button-press$/);
  expect(surface.embedHtml).toContain('<iframe src="');
  expect(surface.embedHtml).toContain("/embed.js");
});

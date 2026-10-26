import type { Library } from "@/lib/content/types";
import { sitemapEntries } from "./sitemap";

const essay = (o: Record<string, unknown>) => ({
  id: "e",
  slug: "button-press",
  title: "Button Press",
  summary: "",
  status: "Published",
  order: 1,
  sectionId: "s",
  coverDemo: null,
  tags: [],
  published: "2026-01-01",
  updated: "2026-02-01",
  relatedIds: [],
  ...o,
});

test("sitemap lists fixed pages, sections, published essays and live demos", () => {
  const published = essay({});
  const soon = essay({ slug: "later", status: "Soon", updated: "2026-03-01" });
  const section = {
    id: "s",
    slug: "interaction",
    name: "Interaction",
    question: "",
    order: 1,
    visible: true,
    essays: [published, soon],
  };
  const library = { sections: [section], bySlug: new Map() } as Library;
  const urls = sitemapEntries(library, {
    live: {},
    gone: { retired: true },
  }).map((e) => e.url.replace(/^https?:\/\/[^/]+/, ""));
  expect(urls).toEqual([
    "/introduction",
    "/about",
    "/resources",
    "/sections/interaction",
    "/button-press",
    "/demos/live",
  ]);
  const sectionEntry = sitemapEntries(library)[3];
  expect(sectionEntry.lastModified).toEqual(new Date("2026-02-01"));
});

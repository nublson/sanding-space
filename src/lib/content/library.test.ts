import { describe, expect, it } from "vitest";
import {
  buildLibrary,
  featuredEssay,
  findPublishedEssay,
  resolvePreview,
} from "./library";
import type { Essay, Section } from "./types";

const section = (o: Partial<Section> = {}): Section => ({
  id: "s1",
  slug: "interaction",
  name: "Interaction",
  question: "?",
  order: 1,
  visible: true,
  ...o,
});
const essay = (o: Partial<Essay> = {}): Essay => ({
  id: "e1",
  slug: "e1",
  title: "E",
  summary: "",
  status: "Published",
  order: 1,
  sectionId: "s1",
  coverDemo: null,
  tags: [],
  published: null,
  updated: "2026-01-01T00:00:00.000Z",
  relatedIds: [],
  ...o,
});

describe("buildLibrary", () => {
  it("drops drafts", () => {
    const lib = buildLibrary(
      [section()],
      [essay(), essay({ id: "d", slug: "d", status: "Draft" })],
    );
    expect(lib.sections[0].essays.map((e) => e.id)).toEqual(["e1"]);
    expect(lib.bySlug.has("d")).toBe(false);
  });

  it("hides invisible and empty sections", () => {
    const lib = buildLibrary(
      [
        section({ id: "s1" }),
        section({ id: "s2", slug: "b", visible: false }),
        section({ id: "s3", slug: "c" }),
      ],
      [
        essay({ id: "a", slug: "a", sectionId: "s1" }),
        essay({ id: "b", slug: "b", sectionId: "s2" }),
        essay({ id: "c", slug: "c", sectionId: "s3", status: "Draft" }),
      ],
    );
    expect(lib.sections.map((s) => s.id)).toEqual(["s1"]);
  });

  it("orders sections and essays by order", () => {
    const lib = buildLibrary(
      [
        section({ id: "s2", slug: "x", order: 2 }),
        section({ id: "s1", order: 1 }),
      ],
      [
        essay({ id: "b", slug: "b", order: 2 }),
        essay({ id: "a", slug: "a", order: 1 }),
        essay({ id: "c", slug: "c", sectionId: "s2" }),
      ],
    );
    expect(lib.sections.map((s) => s.id)).toEqual(["s1", "s2"]);
    expect(lib.sections[0].essays.map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("skips essays without slug or section", () => {
    const lib = buildLibrary(
      [section()],
      [
        essay({ id: "a", slug: "a" }),
        essay({ id: "b", slug: "" }),
        essay({ id: "c", slug: "c", sectionId: null }),
      ],
    );
    expect(lib.sections[0].essays.map((e) => e.id)).toEqual(["a"]);
    expect([...lib.bySlug.keys()]).toEqual(["a"]);
  });
});

describe("featuredEssay", () => {
  it("is the first essay by order, Soon included", () => {
    const lib = buildLibrary(
      [section()],
      [
        essay({ id: "a", slug: "a", status: "Soon", order: 1 }),
        essay({ id: "b", slug: "b", order: 2 }),
      ],
    );
    expect(featuredEssay(lib.sections[0])?.id).toBe("a");
  });
});

describe("findPublishedEssay", () => {
  it("returns only Published essays", () => {
    const lib = buildLibrary(
      [section()],
      [
        essay({ id: "p", slug: "p" }),
        essay({ id: "s", slug: "s", status: "Soon" }),
        essay({ id: "d", slug: "d", status: "Draft" }),
      ],
    );
    expect(findPublishedEssay(lib, "p")?.essay.id).toBe("p");
    expect(findPublishedEssay(lib, "s")).toBeNull();
    expect(findPublishedEssay(lib, "d")).toBeNull();
    expect(findPublishedEssay(lib, "nope")).toBeNull();
  });
});

describe("resolvePreview", () => {
  const essays = [
    essay({ slug: "a", status: "Preview" }),
    essay({ slug: "b", status: "Published" }),
    essay({ slug: "c", status: "Soon" }),
  ];
  it("treats Preview as Published when previews are shown", () => {
    expect(resolvePreview(essays, true).map((e) => e.status)).toEqual([
      "Published",
      "Published",
      "Soon",
    ]);
  });
  it("treats Preview as Draft in production", () => {
    const resolved = resolvePreview(essays, false);
    expect(resolved.map((e) => e.status)).toEqual([
      "Draft",
      "Published",
      "Soon",
    ]);
    expect(
      findPublishedEssay(buildLibrary([section()], resolved), "a"),
    ).toBeNull();
  });
});

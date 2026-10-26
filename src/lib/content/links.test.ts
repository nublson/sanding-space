import { describe, expect, it } from "vitest";
import { INTRODUCTION } from "../introduction";
import { buildLibrary } from "./library";
import { pageHref } from "./links";
import type { Essay } from "./types";

const essay = (o: Partial<Essay>): Essay => ({
  id: "x",
  slug: "x",
  title: "",
  summary: "",
  status: "Published",
  order: 1,
  sectionId: "s1",
  coverDemo: null,
  tags: [],
  published: null,
  updated: "",
  relatedIds: [],
  ...o,
});

describe("pageHref", () => {
  const lib = buildLibrary(
    [
      {
        id: "s1",
        slug: "interaction",
        name: "I",
        question: "",
        order: 1,
        visible: true,
      },
    ],
    [
      essay({ id: "p", slug: "button-press" }),
      essay({ id: "s", slug: "soon-one", status: "Soon" }),
    ],
  );
  const href = pageHref(lib);
  it("links published essays, sections; null otherwise", () => {
    expect(href("p")).toBe("/button-press");
    expect(href("s")).toBeNull();
    expect(href("s1")).toBe("/sections/interaction");
    expect(href("zzz")).toBeNull();
  });
  it("links the Introduction page to its fixed path", () => {
    expect(href(INTRODUCTION.pageId)).toBe("/introduction");
  });
});

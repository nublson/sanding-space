import type { PageObjectResponse } from "@notionhq/client";
import { normalizePageId } from "notionic";
import { describe, expect, it } from "vitest";
import essayFixture from "./__fixtures__/essay-page.json";
import sectionFixture from "./__fixtures__/section-page.json";
import { parseEssay, parseSection } from "./parse";

const section = sectionFixture as unknown as PageObjectResponse;
const essay = essayFixture as unknown as PageObjectResponse;

describe("parseSection", () => {
  it("parses a section page", () => {
    expect(parseSection(section)).toEqual({
      id: normalizePageId(section.id),
      slug: "interaction",
      name: "Interaction",
      question: "How should it respond?",
      order: 3,
      visible: true,
    });
  });
});

describe("parseEssay", () => {
  it("parses an essay page", () => {
    expect(parseEssay(essay)).toEqual({
      id: normalizePageId(essay.id),
      slug: "button-press",
      title: "Button Press",
      summary: "Scale on press.",
      status: "Published",
      order: 1,
      sectionId: normalizePageId(section.id),
      coverDemo: "button-press-scale",
      tags: ["Accessibility"],
      published: "2026-03-01",
      updated: "2026-03-04T10:00:00.000Z",
      relatedIds: [normalizePageId("11111111222233334444555555555555")],
    });
  });

  it("handles missing section, cover demo, order and date", () => {
    const page = structuredClone(essay) as unknown as {
      properties: Record<string, Record<string, unknown>>;
    };
    page.properties.Section.relation = [];
    page.properties["Cover demo"].rich_text = [];
    page.properties.Order.number = null;
    page.properties.Published.date = null;
    const parsed = parseEssay(page as unknown as PageObjectResponse);
    expect(parsed.sectionId).toBeNull();
    expect(parsed.coverDemo).toBeNull();
    expect(parsed.order).toBe(Number.POSITIVE_INFINITY);
    expect(parsed.published).toBeNull();
  });
});

describe("parseEssay status", () => {
  it("reads the Preview status", () => {
    const page = structuredClone(essayFixture) as unknown as PageObjectResponse;
    const props = page.properties as Record<
      string,
      { status?: { name: string } }
    >;
    props.Status = { ...props.Status, status: { name: "Preview" } };
    expect(parseEssay(page).status).toBe("Preview");
  });
});

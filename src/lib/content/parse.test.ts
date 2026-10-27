import type {
  DataSourceObjectResponse,
  PageObjectResponse,
} from "@notionhq/client";
import { normalizePageId } from "notionic";
import { describe, expect, it } from "vitest";
import essayFixture from "./__fixtures__/essay-page.json";
import resourceFixture from "./__fixtures__/resource-page.json";
import resourcesSchemaFixture from "./__fixtures__/resources-data-source.json";
import sectionFixture from "./__fixtures__/section-page.json";
import {
  parseEssay,
  parseResource,
  parseResourcesSchema,
  parseSection,
} from "./parse";

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

describe("parseResource", () => {
  const resource = resourceFixture as unknown as PageObjectResponse;

  it("parses a resource row", () => {
    expect(parseResource(resource)).toEqual({
      id: normalizePageId(resource.id),
      name: "Craft",
      url: "https://craft.gustavofior.com",
      description: "Gustavo Fior's craft notes.",
      category: "Inspiration",
      order: 1,
      visible: true,
    });
  });

  it("finds the columns by type when they are named differently", () => {
    const page = structuredClone(resourceFixture) as unknown as {
      properties: Record<string, Record<string, unknown>>;
    };
    const { Name, URL, Description, Category, Order, Visible } =
      page.properties;
    page.properties = {
      Title: Name,
      Link: URL,
      Blurb: Description,
      Group: Category,
      Rank: Order,
      Shown: Visible,
    };
    const parsed = parseResource(page as unknown as PageObjectResponse);
    expect(parsed.name).toBe("Craft");
    expect(parsed.url).toBe("https://craft.gustavofior.com");
    expect(parsed.description).toBe("Gustavo Fior's craft notes.");
    expect(parsed.category).toBe("Inspiration");
    expect(parsed.order).toBe(1);
    expect(parsed.visible).toBe(true);
  });

  it("hides a row whose Visible is unchecked", () => {
    const page = structuredClone(resourceFixture) as unknown as {
      properties: Record<string, Record<string, unknown>>;
    };
    page.properties.Visible.checkbox = false;
    expect(parseResource(page as unknown as PageObjectResponse).visible).toBe(
      false,
    );
  });

  it("shows every row of a database without a Visible column", () => {
    const page = structuredClone(resourceFixture) as unknown as {
      properties: Record<string, Record<string, unknown>>;
    };
    delete page.properties.Visible;
    expect(parseResource(page as unknown as PageObjectResponse).visible).toBe(
      true,
    );
  });

  it("handles an empty URL, category and order", () => {
    const page = structuredClone(resourceFixture) as unknown as {
      properties: Record<string, Record<string, unknown>>;
    };
    page.properties.URL.url = null;
    page.properties.Category.select = null;
    page.properties.Order.number = null;
    const parsed = parseResource(page as unknown as PageObjectResponse);
    expect(parsed.url).toBe("");
    expect(parsed.category).toBeNull();
    expect(parsed.order).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("parseResourcesSchema", () => {
  const schema = resourcesSchemaFixture as unknown as DataSourceObjectResponse;

  it("reads the intro from the description and the categories in option order", () => {
    expect(parseResourcesSchema(schema)).toEqual({
      intro: "Tools and references I keep coming back to.",
      categories: ["My Purls", "Learning", "Inspiration"],
    });
  });

  it("copes with no description and no select column", () => {
    expect(
      parseResourcesSchema({
        description: [],
        properties: { Name: schema.properties.Name },
      }),
    ).toEqual({ intro: "", categories: [] });
  });
});

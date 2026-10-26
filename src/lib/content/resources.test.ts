import { describe, expect, it } from "vitest";
import { buildResources, categoryId } from "./resources";
import type { ResourceEntry } from "./types";

const entry = (o: Partial<ResourceEntry> = {}): ResourceEntry => ({
  id: "r",
  name: "Craft",
  url: "https://craft.gustavofior.com",
  description: "",
  category: "Inspiration",
  order: 1,
  ...o,
});

const schema = {
  intro: "Tools and references.",
  categories: ["My Purls", "Learning", "Inspiration"],
};

describe("buildResources", () => {
  it("groups rows under the categories in option order, rows by Order then name", () => {
    const built = buildResources(schema, [
      entry({ id: "b", name: "B", category: "Learning", order: 2 }),
      entry({ id: "c", name: "A", category: "Learning", order: 2 }),
      entry({ id: "a", name: "Z", category: "Learning", order: 1 }),
      entry({ id: "i", category: "Inspiration" }),
    ]);
    expect(built.intro).toBe("Tools and references.");
    expect(built.categories.map((c) => c.name)).toEqual([
      "Learning",
      "Inspiration",
    ]);
    expect(built.categories[0].id).toBe("learning");
    expect(built.categories[0].resources.map((r) => r.id)).toEqual([
      "a",
      "c",
      "b",
    ]);
    expect(built.categories[0].resources[0]).not.toHaveProperty("category");
  });

  it("hides empty categories and rows without a name, URL or known category", () => {
    const built = buildResources(schema, [
      entry({ id: "no-url", url: "" }),
      entry({ id: "no-name", name: "" }),
      entry({ id: "no-category", category: null }),
      entry({ id: "unknown", category: "Elsewhere" }),
      entry({ id: "ok", category: "Learning" }),
    ]);
    expect(built.categories.map((c) => c.name)).toEqual(["Learning"]);
    expect(built.categories[0].resources.map((r) => r.id)).toEqual(["ok"]);
  });

  it("puts rows with no Order last", () => {
    const built = buildResources(schema, [
      entry({ id: "none", order: Number.POSITIVE_INFINITY }),
      entry({ id: "two", order: 2 }),
    ]);
    expect(built.categories[0].resources.map((r) => r.id)).toEqual([
      "two",
      "none",
    ]);
  });
});

describe("categoryId", () => {
  it("slugs a category name for a DOM id", () => {
    expect(categoryId("My Purls")).toBe("my-purls");
    expect(categoryId("  Learning & Courses! ")).toBe("learning-courses");
    expect(categoryId("???")).toBe("category");
  });
});

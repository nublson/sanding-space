import type { ResourcesSchema } from "./parse";
import type { ResourceCategory, ResourceEntry } from "./types";

/**
 * The Resources page: a list of tools and references, grouped by category.
 * The sidebar label and path are fixed here; the intro and the list come from
 * the Resources database in Notion (`NOTION_RESOURCES_DATA_SOURCE_ID`):
 * categories in the order of the Category property's options, resources by
 * their Order within each (§3.4).
 */
export const RESOURCES = {
  name: "Resources",
  path: "/resources",
} as const;

export type Resources = {
  /** The one-line intro: the database description in Notion. */
  intro: string;
  categories: ResourceCategory[];
};

/** A DOM id from a category name: "My Purls" is "my-purls". */
export function categoryId(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "category"
  );
}

/**
 * The page's data from the database's schema and rows. A row shows only
 * with a name, a URL and a Category that is one of the options; a category
 * shows only with at least one row. Rows sort by Order, then by name.
 */
export function buildResources(
  schema: ResourcesSchema,
  entries: ResourceEntry[],
): Resources {
  const categories = schema.categories.flatMap((name) => {
    const resources = entries
      .filter((e) => e.category === name && e.name && e.url)
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
      .map(({ category: _category, ...resource }) => resource);
    return resources.length > 0
      ? [{ id: categoryId(name), name, resources }]
      : [];
  });
  return { intro: schema.intro, categories };
}

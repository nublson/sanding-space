import type { ResourceCategory } from "./types";

/**
 * The Resources page: a list of tools and references, grouped by category.
 * The sidebar label and path are fixed here; the intro and the list come from
 * the Resources database in Notion (`NOTION_RESOURCES_DATA_SOURCE_ID`):
 * categories in the order of the Category property's options, resources by
 * their Order within each.
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

/**
 * Layout scaffold only: stands in for the Notion database until the data
 * layer reads it (the next step). Shape and copy follow the database, so the
 * page swaps to live data without changing.
 */
export const PLACEHOLDER_RESOURCES: Resources = {
  intro:
    "Tools and references I keep coming back to. Each essay also lists the specific resources it draws from.",
  categories: [
    {
      id: "my-purls",
      name: "My Purls",
      resources: [
        {
          id: "purl-ui",
          name: "UI",
          url: "https://sanding.space",
          description: "Interface references and patterns.",
          order: 1,
        },
        {
          id: "purl-cool-stuff",
          name: "Cool Stuff",
          url: "https://sanding.space",
          description: "Interesting products, ideas, and details.",
          order: 2,
        },
        {
          id: "purl-articles",
          name: "Articles",
          url: "https://sanding.space",
          description: "Writing worth returning to.",
          order: 3,
        },
      ],
    },
    {
      id: "learning",
      name: "Learning",
      resources: [
        {
          id: "devouring-details",
          name: "Devouring Details",
          url: "https://devouringdetails.com",
          description: "Rauno Freiberg's interaction design course.",
          order: 1,
        },
        {
          id: "animations-dev",
          name: "animations.dev",
          url: "https://animations.dev",
          description: "Emil Kowalski's course on web animations.",
          order: 2,
        },
        {
          id: "interfaces",
          name: "Interfaces",
          url: "https://interfaces.jakubkrehel.com",
          description: "Jakub Krehel's design engineering magazine.",
          order: 3,
        },
      ],
    },
    {
      id: "inspiration",
      name: "Inspiration",
      resources: [
        {
          id: "craft",
          name: "Craft",
          url: "https://craft.gustavofior.com",
          description:
            "Gustavo Fior's notes on the details that make interfaces feel right.",
          order: 1,
        },
        {
          id: "interface-craft",
          name: "Interface Craft",
          url: "https://interfacecraft.online",
          description: "A working library for designing with uncommon care.",
          order: 2,
        },
      ],
    },
  ],
};

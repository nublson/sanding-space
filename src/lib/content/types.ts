/** Preview is Published outside Vercel production and Soon in it (see showPreviews). */
export type EssayStatus = "Published" | "Preview" | "Soon" | "Draft";
export type Section = {
  id: string;
  slug: string;
  name: string;
  question: string;
  order: number;
  visible: boolean;
};
export type Essay = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  status: EssayStatus;
  order: number;
  sectionId: string | null;
  coverDemo: string | null;
  /** The Apply brief for agents (Notion `Apply`): leads the essay's Markdown, never rendered. */
  apply: string | null;
  tags: string[];
  published: string | null;
  updated: string;
  relatedIds: string[];
};
export type LibrarySection = Section & { essays: Essay[] }; // Published + Soon, by order
export type Library = {
  sections: LibrarySection[];
  bySlug: Map<string, { essay: Essay; section: LibrarySection }>;
};

/** One row of the Resources page: an external link with a one-line description. */
/** A row of the Promotions database: an external promo for the announcement slot. */
export type Promotion = {
  id: string;
  name: string;
  description: string;
  url: string;
  /** The line above the name; null means the default ("From the author"). */
  label: string | null;
  active: boolean;
  /** Notion dates (YYYY-MM-DD), both optional and inclusive. */
  start: string | null;
  end: string | null;
  /** The destination's icon as a data URL, once looked up. */
  favicon: string | null;
};

export type Resource = {
  id: string;
  name: string;
  url: string;
  description: string;
  order: number;
  /** The site's icon as a data URL, once looked up; null when it has none. */
  favicon?: string | null;
};
/**
 * A row of the Resources database as parsed: a Resource plus its Category
 * option and its Visible checkbox (true when the database has no such column).
 */
export type ResourceEntry = Resource & {
  category: string | null;
  visible: boolean;
};
/** A Category option of the Resources database, with its resources by Order. */
export type ResourceCategory = {
  id: string;
  name: string;
  resources: Resource[];
};

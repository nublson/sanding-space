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

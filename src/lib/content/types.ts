/** Preview is Published outside Vercel production and Draft in it (see showPreviews). */
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

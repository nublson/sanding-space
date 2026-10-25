import type { Essay, Library, LibrarySection, Section } from "./types";

const byOrder = (a: { order: number }, b: { order: number }) =>
  a.order === b.order ? 0 : a.order < b.order ? -1 : 1;

export function buildLibrary(sections: Section[], essays: Essay[]): Library {
  const listed = essays.filter(
    (e) =>
      (e.status === "Published" || e.status === "Soon") &&
      e.slug !== "" &&
      e.sectionId !== null,
  );
  const result: LibrarySection[] = [];
  const bySlug: Library["bySlug"] = new Map();

  for (const section of [...sections].sort(byOrder)) {
    if (!section.visible) continue;
    const own = listed.filter((e) => e.sectionId === section.id).sort(byOrder);
    if (own.length === 0) continue;
    const librarySection: LibrarySection = { ...section, essays: own };
    result.push(librarySection);
    for (const essay of own) {
      if (!bySlug.has(essay.slug)) {
        bySlug.set(essay.slug, { essay, section: librarySection });
      }
    }
  }
  return { sections: result, bySlug };
}

export function featuredEssay(section: LibrarySection): Essay | null {
  return section.essays.find((e) => e.status === "Published") ?? null;
}

export function findPublishedEssay(library: Library, slug: string) {
  const entry = library.bySlug.get(slug);
  return entry && entry.essay.status === "Published" ? entry : null;
}

/**
 * Settles Preview essays for this environment: Published where previews show,
 * Draft (absent) in production. Everything downstream only sees the four rules
 * of Published / Soon / Draft.
 */
export function resolvePreview(essays: Essay[], show: boolean): Essay[] {
  return essays.map((e) =>
    e.status === "Preview" ? { ...e, status: show ? "Published" : "Draft" } : e,
  );
}

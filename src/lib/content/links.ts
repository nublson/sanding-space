import { INTRODUCTION } from "../introduction";
import type { Library } from "./types";

export function pageHref(library: Library): (pageId: string) => string | null {
  const hrefs = new Map<string, string | null>([
    [INTRODUCTION.pageId, INTRODUCTION.path],
  ]);
  for (const section of library.sections) {
    hrefs.set(section.id, `/sections/${section.slug}`);
    for (const essay of section.essays) {
      hrefs.set(
        essay.id,
        essay.status === "Published" ? `/${essay.slug}` : null,
      );
    }
  }
  return (pageId) => hrefs.get(pageId) ?? null;
}

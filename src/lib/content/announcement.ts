import type { Essay, Library, Promotion } from "./types";

/** How long a newly published essay is announced, from its Published date. */
export const ANNOUNCE_DAYS = 14;
const DAY_MS = 86_400_000;

/**
 * One thing the announcement slot can show: the newest essay, or an external
 * promo from the Promotions database. The window is a pair of ISO times, null
 * meaning open; the browser checks it (isLive), since the layout prerenders
 * and reading the clock there fails the build.
 */
export type AnnouncementItem = {
  kind: "essay" | "external";
  /** The essay's slug, or the promo's Notion page id. */
  id: string;
  title: string;
  summary: string;
  href: string;
  /** "New essay" for essays; null for promos. */
  label: string | null;
  /** The destination's favicon (external items only). */
  icon: string | null;
  startsAt: string | null;
  expiresAt: string | null;
};

/** 00:00 UTC on a Notion date's day, plus whole days, as an ISO string. */
function dayStart(date: string, plusDays = 0): string {
  const start = Date.parse(`${date.slice(0, 10)}T00:00:00.000Z`);
  return new Date(start + plusDays * DAY_MS).toISOString();
}

/** The newest Published essay with a date; ties go to section, then essay order. */
export function essayAnnouncement(library: Library): AnnouncementItem | null {
  let newest: Essay | null = null;
  let newestDay = "";
  for (const section of library.sections) {
    for (const essay of section.essays) {
      if (essay.status !== "Published" || !essay.published) continue;
      const day = essay.published.slice(0, 10);
      if (day > newestDay) {
        newest = essay;
        newestDay = day;
      }
    }
  }
  if (!newest) return null;
  return {
    kind: "essay",
    id: newest.slug,
    title: newest.title,
    summary: newest.summary,
    href: `/${newest.slug}`,
    label: "New essay",
    icon: null,
    startsAt: null,
    expiresAt: dayStart(newestDay, ANNOUNCE_DAYS),
  };
}

/** A promo as an item: from Start at 00:00 UTC to the end of its End day. */
export function promotionAnnouncement(p: Promotion): AnnouncementItem {
  return {
    kind: "external",
    id: p.id,
    title: p.name,
    summary: p.description,
    href: p.url,
    // No label: a short Name and its Description say what a promo is.
    label: null,
    icon: p.favicon,
    startsAt: p.start ? dayStart(p.start) : null,
    expiresAt: p.end ? dayStart(p.end, 1) : null,
  };
}

/** Everything the slot may show, in priority order: promos, then the essay. */
export function announcementItems(
  library: Library,
  promotions: Promotion[],
): AnnouncementItem[] {
  const essay = essayAnnouncement(library);
  return [...promotions.map(promotionAnnouncement), ...(essay ? [essay] : [])];
}

export function isLive(item: AnnouncementItem, now: number): boolean {
  return (
    (item.startsAt === null || now >= Date.parse(item.startsAt)) &&
    (item.expiresAt === null || now < Date.parse(item.expiresAt))
  );
}

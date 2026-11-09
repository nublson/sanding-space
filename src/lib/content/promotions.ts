import type { Promotion } from "./types";

/**
 * The promos that may run, in priority order: Active rows with a name and a
 * URL, the latest Start first (an empty Start last), then by name. Whether
 * each is within its dates is decided in the browser (isLive).
 */
export function selectPromotions(rows: Promotion[]): Promotion[] {
  return rows
    .filter((p) => p.active && p.name && p.url)
    .sort((a, b) => {
      const byStart = (b.start ?? "").localeCompare(a.start ?? "");
      return byStart || a.name.localeCompare(b.name);
    });
}

export const SITE_NAME = "Sanding Space";

export const SITE_URL: string = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://sanding.space"
).replace(/\/+$/, "");

export function title(page?: string): string {
  return page ? `${page} · ${SITE_NAME}` : SITE_NAME;
}

export const SITE_NAME = "Sanding Space";

export const SITE_URL: string = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://sanding.space"
).replace(/\/+$/, "");

/** Preview essays show everywhere except Vercel production. */
export function showPreviews(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.VERCEL_ENV !== "production";
}

export function title(page?: string): string {
  return page ? `${page} · ${SITE_NAME}` : SITE_NAME;
}

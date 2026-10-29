import type { Metadata } from "next";

export const SITE_NAME = "Sanding Space";

export const SITE_URL: string = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://sanding.space"
).replace(/\/+$/, "");

export const SITE_DESCRIPTION =
  "Short essays about design engineering and product engineering, with live, embeddable demos.";

/** The author, for structured data and Open Graph. */
export const AUTHOR = {
  name: "Nubelson Fernandes",
  url: "https://nublson.com",
};

/** Preview essays show everywhere except Vercel production. */
export function showPreviews(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.VERCEL_ENV !== "production";
}

export function title(page?: string): string {
  return page ? `${page} · ${SITE_NAME}` : SITE_NAME;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * The oEmbed discovery link for a page (`alternates.types`), so editors can
 * turn a pasted link into the live demo or an essay card.
 */
export function oembedDiscovery(
  path: string,
): NonNullable<NonNullable<Metadata["alternates"]>["types"]> {
  return {
    "application/json+oembed": `${SITE_URL}/api/oembed?url=${encodeURIComponent(absoluteUrl(path))}&format=json`,
  };
}

/**
 * Per-page metadata: an absolute title, the canonical URL, and Open Graph and
 * Twitter fields that carry the same title and description. Images come from
 * the route's opengraph-image file, so they are never set here.
 */
export function pageMetadata({
  name,
  description,
  path,
  type = "website",
  ownImage = false,
  article,
}: {
  /** The page name; the site name is appended. Omit for the site itself. */
  name?: string;
  description?: string;
  path: string;
  type?: "website" | "article";
  /** The route has its own opengraph-image file; leave images to it. */
  ownImage?: boolean;
  article?: {
    publishedTime?: string | null;
    modifiedTime?: string;
    tags?: string[];
    section?: string;
  };
}): Metadata {
  const resolvedTitle = title(name);
  const resolvedDescription = description || SITE_DESCRIPTION;
  const url = absoluteUrl(path);
  // A page's openGraph replaces the layout's whole object, root card included,
  // so pages without a card of their own name the root card here. An explicit
  // list would also beat a route's own opengraph-image file, hence ownImage.
  // Next applies that file only when `images` is absent, not merely undefined
  // (it checks hasOwnProperty), so with ownImage the key is left out.
  const images = ownImage
    ? {}
    : {
        images: [
          {
            url: absoluteUrl("/opengraph-image"),
            width: 1200,
            height: 630,
            alt: SITE_NAME,
          },
        ],
      };
  return {
    title: { absolute: resolvedTitle },
    description: resolvedDescription,
    alternates: { canonical: url },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      type,
      ...images,
      ...(type === "article" && article
        ? {
            publishedTime: article.publishedTime ?? undefined,
            modifiedTime: article.modifiedTime,
            authors: [AUTHOR.url],
            section: article.section,
            tags: article.tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      ...images,
    },
  };
}

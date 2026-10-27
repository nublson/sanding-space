/**
 * The agent-facing parts of next.config.ts: Markdown negotiation and the Link
 * header. Both live in config rather than a proxy, so no function runs per
 * request and the HTML routes stay untouched.
 */

/** Pages that answer `Accept: text/markdown`: one segment (essays, Introduction, About, Resources) and sections. */
const PAGE_SOURCES = [
  { source: "/:slug([^/.]+)", path: ":slug" },
  { source: "/sections/:slug([^/.]+)", path: "sections/:slug" },
] as const;

const ACCEPTS_MARKDOWN = [
  { type: "header" as const, key: "accept", value: ".*text/markdown.*" },
];

/** A zero weight (`text/markdown;q=0`) refuses Markdown, so that client gets HTML. */
const REFUSES_MARKDOWN = [
  {
    type: "header" as const,
    key: "accept",
    value: ".*text/markdown\\s*;\\s*q=0(\\.0{0,3})?\\s*(,.*)?",
  },
];

export function markdownRewrites() {
  return PAGE_SOURCES.map(({ source, path }) => ({
    source,
    has: ACCEPTS_MARKDOWN,
    missing: REFUSES_MARKDOWN,
    destination: `/api/markdown/${path}`,
  }));
}

/** RFC 8288 links every response carries: the API catalog (RFC 9727), llms.txt and the sitemap. */
export const SITE_LINKS = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</llms.txt>; rel="describedby"; type="text/plain"',
  '</sitemap.xml>; rel="sitemap"; type="application/xml"',
];

export function linkHeaders() {
  return [
    {
      source: "/:path*",
      headers: [{ key: "Link", value: SITE_LINKS.join(", ") }],
    },
    // Later rules win for the same key, so pages repeat the site links and
    // add their own Markdown alternate.
    ...PAGE_SOURCES.map(({ source, path }) => ({
      source,
      headers: [
        {
          key: "Link",
          value: [
            `</${path}>; rel="alternate"; type="text/markdown"`,
            ...SITE_LINKS,
          ].join(", "),
        },
      ],
    })),
  ];
}

/**
 * Structured data for search engines, as the Next docs show it: a plain script
 * tag (not next/script, since nothing executes), with "<" escaped so content
 * can never close the tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD, escaped above the fold
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

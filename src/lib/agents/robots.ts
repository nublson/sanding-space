import { absoluteUrl } from "../site";

/** Named so the rules visibly cover them; the wildcard group already does. */
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "Meta-ExternalAgent",
  "Bytespider",
] as const;

/** contentsignals.org: the essays and demos may be searched, quoted by agents and trained on. */
export const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=yes";

/**
 * Everything is public, including demos (spec §6: indexable, canonical to
 * themselves). Only the API is kept out of the index; agents reach it through
 * the manifests listed in /.well-known/ard.json.
 */
export function robotsTxt(): string {
  const group = (agents: readonly string[]) => [
    ...agents.map((agent) => `User-Agent: ${agent}`),
    "Allow: /",
    "Disallow: /api/",
    `Content-Signal: ${CONTENT_SIGNAL}`,
    "",
  ];
  return [
    ...group(["*"]),
    ...group(AI_BOTS),
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    `Agentmap: ${absoluteUrl("/.well-known/ard.json")}`,
    "",
  ].join("\n");
}

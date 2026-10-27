import nextConfig from "../../../next.config";
import { CONTENT_SIGNAL, robotsTxt } from "./robots";

async function rewrites() {
  const config = await nextConfig.rewrites?.();
  if (!config || Array.isArray(config)) throw new Error("expected phases");
  return config.beforeFiles ?? [];
}

test("pages rewrite to the Markdown route only when Markdown is accepted", async () => {
  const rules = await rewrites();
  expect(rules).toEqual([
    expect.objectContaining({
      source: "/:slug([^/.]+)",
      destination: "/api/markdown/:slug",
    }),
    expect.objectContaining({
      source: "/sections/:slug([^/.]+)",
      destination: "/api/markdown/sections/:slug",
    }),
  ]);
  for (const rule of rules) {
    const [has] = rule.has ?? [];
    expect(has).toMatchObject({ type: "header", key: "accept" });
    const accept = new RegExp(`^${(has as { value: string }).value}$`);
    expect(accept.test("text/markdown")).toBe(true);
    expect(accept.test("text/markdown, text/html;q=0.9")).toBe(true);
    expect(accept.test("text/html,application/xhtml+xml,*/*;q=0.8")).toBe(
      false,
    );
  }
});

test("every response links the API catalog; pages also link their Markdown", async () => {
  const rules = (await nextConfig.headers?.()) ?? [];
  const link = (source: string) =>
    rules
      .find((r) => r.source === source)
      ?.headers.find((h) => h.key === "Link")?.value;
  expect(link("/:path*")).toContain('rel="api-catalog"');
  expect(link("/:slug([^/.]+)")).toMatch(
    /^<\/:slug>; rel="alternate"; type="text\/markdown", .*rel="api-catalog"/,
  );
  expect(link("/sections/:slug([^/.]+)")).toContain("</sections/:slug>");
});

test("robots.txt keeps the API out, declares content signals and the agent map", () => {
  const txt = robotsTxt();
  expect(txt.startsWith("User-Agent: *\nAllow: /\nDisallow: /api/\n")).toBe(
    true,
  );
  expect(txt).toContain("User-Agent: ClaudeBot\n");
  expect(txt.match(/^Content-Signal: (.*)$/gm)).toEqual([
    `Content-Signal: ${CONTENT_SIGNAL}`,
    `Content-Signal: ${CONTENT_SIGNAL}`,
  ]);
  expect(txt).toMatch(/^Sitemap: https?:\/\/.+\/sitemap\.xml$/m);
  expect(txt).toMatch(/^Agentmap: https?:\/\/.+\/\.well-known\/ard\.json$/m);
});

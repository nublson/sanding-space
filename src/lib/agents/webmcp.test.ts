import { essayLines, webmcpTools } from "./webmcp";

const LLMS = [
  "# Sanding Space",
  "",
  "> Essays with motion demos.",
  "",
  "## Motion",
  "",
  "How should it move?",
  "",
  "- [Motion](https://sanding.space/sections/motion): the section's introduction",
  "- [Easing](https://sanding.space/easing): Curves that feel right.",
  "- [Springs](https://sanding.space/springs): Physical motion.",
  "",
  "## Pages",
  "",
  "- [About](https://sanding.space/about): what you may do with motion demos",
  "",
  "## Optional",
  "",
  "- [oEmbed](https://sanding.space/api/oembed): embed codes",
].join("\n");

test("essay lines skip section links, fixed pages and agent surfaces", () => {
  expect(essayLines(LLMS)).toEqual([
    "- [Easing](https://sanding.space/easing): Curves that feel right.",
    "- [Springs](https://sanding.space/springs): Physical motion.",
  ]);
});

function fetcher(routes: Record<string, [number, string]>) {
  return vi.fn(async (url: string) => {
    const [status, body] = routes[url] ?? [404, ""];
    return new Response(body, { status });
  }) as unknown as typeof fetch;
}

const tool = (f: typeof fetch, name: string) => {
  const found = webmcpTools(f).find((t) => t.name === name);
  if (!found) throw new Error(name);
  return found;
};
const textOf = async (p: ReturnType<ReturnType<typeof tool>["execute"]>) =>
  (await p).content[0].text;

test("search matches titles and summaries, not link targets", async () => {
  const f = fetcher({ "/llms.txt": [200, LLMS] });
  const search = tool(f, "search_essays");
  expect(await textOf(search.execute({ query: "physical" }))).toBe(
    "- [Springs](https://sanding.space/springs): Physical motion.",
  );
  expect(await textOf(search.execute({ query: "sanding" }))).toBe(
    'No essays matched "sanding". Try list_essays.',
  );
  expect(await textOf(search.execute({ query: "oembed" }))).toBe(
    'No essays matched "oembed". Try list_essays.',
  );
});

test("get_page asks for Markdown and explains a missing page", async () => {
  const f = fetcher({ "/easing": [200, "# Easing\n"] });
  const get = tool(f, "get_page");
  expect(await textOf(get.execute({ path: "/easing/" }))).toBe("# Easing\n");
  expect(f).toHaveBeenCalledWith("/easing", {
    headers: { Accept: "text/markdown" },
  });
  expect(await textOf(get.execute({ path: "nope" }))).toBe(
    'No page at "nope". Use list_essays.',
  );
});

test("an HTTP error on the index reads as unavailable, not as content", async () => {
  const f = fetcher({ "/llms.txt": [500, "Internal Server Error"] });
  const unavailable = "Could not reach Sanding Space. Try again later.";
  expect(await textOf(tool(f, "list_essays").execute())).toBe(unavailable);
  expect(await textOf(tool(f, "search_essays").execute({ query: "x" }))).toBe(
    unavailable,
  );
});

test("tools answer instead of throwing", async () => {
  const broken = vi.fn(() =>
    Promise.reject(new Error("offline")),
  ) as unknown as typeof fetch;
  for (const t of webmcpTools(broken)) {
    await expect(t.execute(undefined)).resolves.toHaveProperty("content");
    await expect(t.execute({ query: "x", path: "x" })).resolves.toHaveProperty(
      "content",
    );
  }
});

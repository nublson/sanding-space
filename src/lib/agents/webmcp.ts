/**
 * WebMCP tools for agents running in the visitor's browser. They read the
 * same public surfaces as everyone else (/llms.txt, Markdown negotiation), and
 * never throw: a failed fetch answers with a message instead.
 */

export type WebmcpResult = { content: { type: "text"; text: string }[] };

export type WebmcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: true };
  execute: (input?: Record<string, unknown>) => Promise<WebmcpResult>;
};

const result = (text: string): WebmcpResult => ({
  content: [{ type: "text", text }],
});

const UNAVAILABLE = "Could not reach Sanding Space. Try again later.";

export function webmcpTools(fetcher: typeof fetch): WebmcpTool[] {
  const index = async () => (await fetcher("/llms.txt")).text();

  return [
    {
      name: "list_essays",
      description:
        "List every Sanding Space section and essay with its link and summary.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      async execute() {
        try {
          return result(await index());
        } catch {
          return result(UNAVAILABLE);
        }
      },
    },
    {
      name: "search_essays",
      description:
        "Search Sanding Space essays by keyword (matches titles and summaries).",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Keyword to look for." },
        },
        required: ["query"],
      },
      annotations: { readOnlyHint: true },
      async execute(input = {}) {
        const query = String(input.query ?? "").trim();
        if (!query) return result("Provide a query, or use list_essays.");
        try {
          const needle = query.toLowerCase();
          const matches = (await index()).split("\n").filter(
            (line) =>
              line.startsWith("- ") &&
              // Match the text, not the link target.
              line
                .replace(/\]\([^)]*\)/, "]")
                .toLowerCase()
                .includes(needle),
          );
          return result(
            matches.length > 0
              ? matches.join("\n")
              : `No essays matched "${query}". Try list_essays.`,
          );
        } catch {
          return result(UNAVAILABLE);
        }
      },
    },
    {
      name: "get_page",
      description:
        "Read a Sanding Space page as Markdown by its path: an essay slug, sections/{slug}, introduction, about or resources.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "For example button-press." },
        },
        required: ["path"],
      },
      annotations: { readOnlyHint: true },
      async execute(input = {}) {
        const path = String(input.path ?? "").replace(/^\/+|\/+$/g, "");
        if (!path) return result("Provide a path, or use list_essays.");
        try {
          const response = await fetcher(
            `/${path.split("/").map(encodeURIComponent).join("/")}`,
            { headers: { Accept: "text/markdown" } },
          );
          if (response.status === 404)
            return result(`No page at "${path}". Use list_essays.`);
          if (!response.ok) return result(UNAVAILABLE);
          return result(await response.text());
        } catch {
          return result(UNAVAILABLE);
        }
      },
    },
  ];
}

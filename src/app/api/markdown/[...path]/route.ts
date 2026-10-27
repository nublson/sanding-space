import { pageMarkdown } from "@/lib/agents/content";
import { estimateTokens } from "@/lib/agents/markdown";

// Pages answer here when the request asks for `Accept: text/markdown`: the
// rewrite lives in next.config.ts, so the HTML routes stay untouched.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  let markdown: string | null;
  try {
    markdown = await pageMarkdown(path.map(decodeURIComponent).join("/"));
  } catch {
    return new Response("Content temporarily unavailable.\n", {
      status: 503,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }
  if (markdown === null) {
    return new Response(
      "# Not found\n\nNo page at this path. See /llms.txt for every page.\n",
      {
        status: 404,
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
      },
    );
  }
  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
      "x-markdown-tokens": String(estimateTokens(markdown)),
    },
  });
}

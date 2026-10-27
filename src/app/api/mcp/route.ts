import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  listDemos,
  listEssays,
  listResources,
  pageMarkdown,
  searchEssays,
} from "@/lib/agents/content";
import { AGENT_VERSION, agentTool } from "@/lib/agents/tools";

function json(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

function text(value: string, isError = false) {
  return { content: [{ type: "text" as const, text: value }], isError };
}

const readOnly = { readOnlyHint: true, openWorldHint: false };

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_essays",
      {
        ...agentTool("list_essays"),
        inputSchema: z.object({}),
        annotations: readOnly,
      },
      async () => json(await listEssays()),
    );

    server.registerTool(
      "search_essays",
      {
        ...agentTool("search_essays"),
        inputSchema: z.object({ query: z.string().min(1) }),
        annotations: readOnly,
      },
      async ({ query }) => {
        const matches = await searchEssays(query);
        return matches.length > 0
          ? json(matches)
          : text(`No essays matched "${query}". Try list_essays.`);
      },
    );

    server.registerTool(
      "get_page",
      {
        ...agentTool("get_page"),
        inputSchema: z.object({ path: z.string().min(1) }),
        annotations: readOnly,
      },
      async ({ path }) => {
        const clean = path.replace(/^\/+|\/+$/g, "");
        const markdown = await pageMarkdown(clean);
        return markdown === null
          ? text(`No page at "${path}". Use list_essays for essay slugs.`, true)
          : text(markdown);
      },
    );

    server.registerTool(
      "list_demos",
      {
        ...agentTool("list_demos"),
        inputSchema: z.object({}),
        annotations: readOnly,
      },
      async () => json(await listDemos()),
    );

    server.registerTool(
      "list_resources",
      {
        ...agentTool("list_resources"),
        inputSchema: z.object({}),
        annotations: readOnly,
      },
      async () => json(await listResources()),
    );
  },
  { serverInfo: { name: "sanding.space", version: AGENT_VERSION } },
);

export { handler as GET, handler as POST, handler as DELETE };

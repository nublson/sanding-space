import type { DemoItem, EssayItem } from "./content";
import { AGENT_TOOLS } from "./tools";

/**
 * A2A v1.0 over JSON-RPC: `SendMessage` answers synchronously with a Message.
 * A data part naming a skill runs it; free text searches the essays. No task
 * is ever created, so the task methods answer TaskNotFound.
 */

const ERROR = {
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
  internal: -32603,
  taskNotFound: -32001,
} as const;

export type A2APart = { text: string } | { data: unknown };

export type A2AResponse = {
  jsonrpc: "2.0";
  id: unknown;
  result?: {
    message: { messageId: string; role: "ROLE_AGENT"; parts: A2APart[] };
  };
  error?: { code: number; message: string };
};

export type A2ADeps = {
  listEssays(): Promise<EssayItem[]>;
  searchEssays(query: string): Promise<EssayItem[]>;
  getPage(path: string): Promise<string | null>;
  listDemos(): Promise<DemoItem[]>;
  listResources(): Promise<unknown>;
};

const EXAMPLES: Record<(typeof AGENT_TOOLS)[number]["name"], string[]> = {
  list_essays: ["What essays are on Sanding Space?"],
  search_essays: ["Find essays about motion"],
  get_page: ["Read the essay with slug button-press"],
  list_demos: ["Which demos can I embed?"],
  list_resources: ["What tools does Sanding Space recommend?"],
};

export const A2A_SKILLS = AGENT_TOOLS.map((tool) => ({
  id: tool.name,
  name: tool.title,
  description: tool.description,
  tags: ["sanding-space", "read-only"],
  examples: EXAMPLES[tool.name],
}));

function fail(id: unknown, code: number, message: string): A2AResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function reply(id: unknown, parts: A2APart[]): A2AResponse {
  return {
    jsonrpc: "2.0",
    id,
    result: {
      message: { messageId: crypto.randomUUID(), role: "ROLE_AGENT", parts },
    },
  };
}

function textOf(parts: unknown[]): string {
  return parts
    .filter(
      (p): p is { text: string } =>
        typeof (p as { text?: unknown })?.text === "string",
    )
    .map((p) => p.text)
    .join(" ")
    .trim();
}

function dataOf(parts: unknown[]): Record<string, unknown> | null {
  const part = parts.find(
    (p) =>
      p !== null &&
      typeof p === "object" &&
      typeof (p as { data?: unknown }).data === "object" &&
      (p as { data?: unknown }).data !== null,
  ) as { data: Record<string, unknown> } | undefined;
  return part ? part.data : null;
}

async function runSkill(
  skill: string,
  args: Record<string, unknown>,
  deps: A2ADeps,
): Promise<A2APart[] | { invalid: string }> {
  switch (skill) {
    case "list_essays": {
      const essays = await deps.listEssays();
      return [
        { text: `${essays.length} essay(s).` },
        { data: { skill, essays } },
      ];
    }
    case "search_essays": {
      const query = typeof args.query === "string" ? args.query.trim() : "";
      if (!query) return { invalid: "search_essays requires a query string." };
      const matches = await deps.searchEssays(query);
      return [
        { text: `${matches.length} essay(s) matched "${query}".` },
        { data: { skill, query, matches } },
      ];
    }
    case "get_page": {
      const path =
        typeof args.path === "string"
          ? args.path.replace(/^\/+|\/+$/g, "")
          : "";
      if (!path) return { invalid: "get_page requires a path." };
      const markdown = await deps.getPage(path);
      return [
        {
          text:
            markdown ??
            `No page at "${path}". Use list_essays for essay slugs.`,
        },
      ];
    }
    case "list_demos": {
      const demos = await deps.listDemos();
      return [{ text: `${demos.length} demo(s).` }, { data: { skill, demos } }];
    }
    case "list_resources": {
      const resources = await deps.listResources();
      return [
        { text: "Resources by category." },
        { data: { skill, resources } },
      ];
    }
    default:
      return {
        invalid: `Unknown skill "${skill}". Skills: ${A2A_SKILLS.map((s) => s.id).join(", ")}.`,
      };
  }
}

export async function handleA2ARequest(
  body: unknown,
  deps: A2ADeps,
): Promise<A2AResponse> {
  const request = (body ?? {}) as {
    jsonrpc?: unknown;
    id?: unknown;
    method?: unknown;
    params?: unknown;
  };
  const id = request.id ?? null;

  if (request.jsonrpc !== "2.0")
    return fail(id, ERROR.invalidRequest, 'Expected "jsonrpc": "2.0".');

  switch (request.method) {
    case "SendMessage":
      break;
    case "GetTask":
    case "ListTasks":
    case "CancelTask":
      return fail(
        id,
        ERROR.taskNotFound,
        "This agent answers with Messages and creates no tasks.",
      );
    default:
      return fail(
        id,
        ERROR.methodNotFound,
        `Unknown method "${String(request.method)}".`,
      );
  }

  const message = (request.params as { message?: { parts?: unknown } })
    ?.message;
  if (!message || !Array.isArray(message.parts))
    return fail(
      id,
      ERROR.invalidParams,
      "SendMessage requires params.message with a parts array.",
    );

  const data = dataOf(message.parts);
  const text = textOf(message.parts);

  try {
    const outcome =
      data && typeof data.skill === "string"
        ? await runSkill(data.skill, data, deps)
        : text
          ? await runSkill("search_essays", { query: text }, deps)
          : {
              invalid:
                "Send a text part to search, or a data part naming a skill.",
            };
    if ("invalid" in outcome)
      return fail(id, ERROR.invalidParams, outcome.invalid);
    return reply(id, outcome);
  } catch {
    return fail(id, ERROR.internal, "Could not read the library.");
  }
}

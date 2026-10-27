import { type A2ADeps, handleA2ARequest } from "@/lib/agents/a2a";
import {
  listDemos,
  listEssays,
  listResources,
  pageMarkdown,
  searchEssays,
} from "@/lib/agents/content";

const deps: A2ADeps = {
  listEssays,
  searchEssays,
  getPage: pageMarkdown,
  listDemos,
  listResources,
};

const headers = { "Access-Control-Allow-Origin": "*" };

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error." },
      },
      { headers },
    );
  }
  return Response.json(await handleA2ARequest(body, deps), { headers });
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...headers,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

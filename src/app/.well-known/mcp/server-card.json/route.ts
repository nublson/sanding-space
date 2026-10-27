import { mcpServerCard } from "@/lib/agents/manifests";

export function GET() {
  return Response.json(mcpServerCard(), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

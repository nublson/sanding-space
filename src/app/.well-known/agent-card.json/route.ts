import { a2aAgentCard } from "@/lib/agents/manifests";

export function GET() {
  return Response.json(a2aAgentCard(), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

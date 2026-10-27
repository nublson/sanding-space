import { agentSkillsIndex } from "@/lib/agents/manifests";

export function GET() {
  return Response.json(agentSkillsIndex(), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

import { openApi } from "@/lib/agents/manifests";

export function GET() {
  return Response.json(openApi(), {
    headers: {
      "Content-Type": "application/openapi+json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

import { ardManifest } from "@/lib/agents/manifests";

export function GET() {
  return Response.json(ardManifest(), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

import { apiCatalog } from "@/lib/agents/manifests";

export function GET() {
  return Response.json(apiCatalog(), {
    headers: {
      "Content-Type": "application/linkset+json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

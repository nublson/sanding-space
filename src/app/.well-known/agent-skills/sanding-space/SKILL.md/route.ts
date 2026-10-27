import { skillMd } from "@/lib/agents/manifests";

// The index's digest hashes this same string, so the two never drift.
export function GET() {
  return new Response(skillMd(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

import { llmsTxt } from "@/lib/agents/markdown";
import { getLibrary } from "@/lib/content/notion";

export async function GET() {
  const { sections } = await getLibrary();
  return new Response(llmsTxt(sections), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

import { robotsTxt } from "@/lib/agents/robots";

// A route rather than robots.ts: Next's robots type has no Content-Signal.
export function GET() {
  return new Response(robotsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

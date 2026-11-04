/**
 * Handing an essay to an AI assistant: one prompt pointing at the essay URL
 * (whose Markdown leads with its Apply brief), opened prefilled in each app.
 */

export function agentPrompt(url: string, hasApply: boolean): string {
  return hasApply
    ? `Read ${url} and apply its "Apply this to your code" brief to my project.`
    : `Read ${url} and apply what it teaches to my project.`;
}

const OPEN_IN = [
  { name: "Claude", base: "https://claude.ai/new?q=" },
  { name: "ChatGPT", base: "https://chatgpt.com/?q=" },
  // Cursor's web deeplink: the prompt is prefilled for review, never run.
  { name: "Cursor", base: "https://cursor.com/link/prompt?text=" },
] as const;

export function openInLinks(
  prompt: string,
): { name: (typeof OPEN_IN)[number]["name"]; href: string }[] {
  return OPEN_IN.map(({ name, base }) => ({
    name,
    href: base + encodeURIComponent(prompt),
  }));
}

/**
 * Handing an essay to an LLM: one prompt pointing at the essay's Markdown
 * (`<url>.md`), followed by its Apply brief when it has one.
 */
export function llmPrompt(
  title: string,
  url: string,
  apply: string | null,
): string {
  const prompt = `Read ${title} at ${url}.md and apply it to the interface in the current environment.`;
  return apply ? `${prompt}\n\n${apply.trim()}` : prompt;
}

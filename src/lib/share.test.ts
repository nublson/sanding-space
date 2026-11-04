import { llmPrompt } from "./share";

const url = "https://sanding.space/button-press";
const prompt =
  "Read Button Press at https://sanding.space/button-press.md and apply it to the interface in the current environment.";

test("llmPrompt points at the essay's Markdown URL", () => {
  expect(llmPrompt("Button Press", url, null)).toBe(prompt);
});

test("llmPrompt follows with the Apply brief", () => {
  expect(llmPrompt("Button Press", url, "- Scale to 0.97.\n")).toBe(
    `${prompt}\n\n- Scale to 0.97.`,
  );
});

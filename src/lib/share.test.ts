import { agentPrompt, openInLinks } from "./share";

const url = "https://sanding.space/button-press";

describe("agentPrompt", () => {
  it("points at the brief when the essay has one", () => {
    expect(agentPrompt(url, true)).toBe(
      'Read https://sanding.space/button-press and apply its "Apply this to your code" brief to my project.',
    );
  });

  it("asks for the lessons when it has none", () => {
    expect(agentPrompt(url, false)).toBe(
      "Read https://sanding.space/button-press and apply what it teaches to my project.",
    );
  });
});

describe("openInLinks", () => {
  it("opens Claude, ChatGPT and Cursor with the prompt intact", () => {
    const prompt = agentPrompt("https://sanding.space/a&b#c?d=1 e", true);
    const links = openInLinks(prompt);

    expect(links.map((link) => link.name)).toEqual([
      "Claude",
      "ChatGPT",
      "Cursor",
    ]);
    const bases = [
      "https://claude.ai/new?q=",
      "https://chatgpt.com/?q=",
      "https://cursor.com/link/prompt?text=",
    ];
    links.forEach((link, i) => {
      expect(link.href.startsWith(bases[i])).toBe(true);
      const query = link.href.slice(bases[i].length);
      expect(query).not.toMatch(/[&#\s"]/);
      expect(decodeURIComponent(query)).toBe(prompt);
    });
  });
});

import { highlightCode, shikiLanguage } from "./highlight";

describe("shikiLanguage", () => {
  it("highlights Notion's TypeScript and JavaScript as TSX and JSX", () => {
    expect(shikiLanguage("typescript")).toBe("tsx");
    expect(shikiLanguage("javascript")).toBe("jsx");
  });

  it("keeps the languages it loads and drops the rest", () => {
    expect(shikiLanguage("css")).toBe("css");
    expect(shikiLanguage("shell")).toBe("bash");
    expect(shikiLanguage("plain text")).toBeNull();
    expect(shikiLanguage("cobol")).toBeNull();
  });
});

describe("highlightCode", () => {
  it("returns one line of tokens per line, colored by the theme's variables", async () => {
    const lines = await highlightCode('const a = "b";\n// note', "typescript");
    expect(lines).toHaveLength(2);
    expect(lines[0].map((t) => t.content).join("")).toBe('const a = "b";');
    expect(lines[0][0]).toEqual({
      content: "const",
      color: "var(--shiki-token-keyword)",
      italic: false,
    });
    expect(lines[1]).toEqual([
      {
        content: "// note",
        color: "var(--shiki-token-comment)",
        italic: false,
      },
    ]);
  });

  it("returns plain lines for a language it doesn't load", async () => {
    expect(await highlightCode("a\nb", "cobol")).toEqual([
      [{ content: "a", color: null, italic: false }],
      [{ content: "b", color: null, italic: false }],
    ]);
  });

  it("keeps an empty line as an empty line", async () => {
    const lines = await highlightCode("a\n\nb", "plain text");
    expect(lines.map((line) => line.map((t) => t.content).join(""))).toEqual([
      "a",
      "",
      "b",
    ]);
  });
});

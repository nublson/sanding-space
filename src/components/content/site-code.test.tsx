import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BlockProps } from "notionic";
import { copyText } from "@/lib/clipboard";
import { SiteCode } from "./site-code";

vi.mock("@/lib/clipboard", () => ({ copyText: vi.fn(async () => {}) }));

const text = (t: string) => ({
  type: "text",
  plain_text: t,
  text: { content: t, link: null },
  href: null,
  annotations: {
    bold: false,
    italic: false,
    strikethrough: false,
    underline: false,
    code: false,
    color: "default",
  },
});

function block(code: string, language: string, caption = "") {
  return {
    type: "code",
    code: {
      rich_text: [text(code)],
      caption: caption ? [text(caption)] : [],
      language,
    },
  } as unknown as BlockProps<"code">["block"];
}

async function renderCode(code: string, language = "typescript", caption = "") {
  render(
    await SiteCode({
      block: block(code, language, caption),
      context: {} as never,
    }),
  );
}

describe("SiteCode", () => {
  it("keeps the frame: language label and a focusable, named pre", async () => {
    await renderCode("const a = 1;");
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    const pre = screen.getByLabelText("Code, TypeScript");
    expect(pre.tagName).toBe("PRE");
    expect(pre).toHaveAttribute("tabindex", "0");
    expect(pre).toHaveTextContent("const a = 1;");
  });

  it("colors tokens with the theme's colors", async () => {
    await renderCode('const a = "b";');
    const keyword = screen.getByText("const");
    const string = screen.getByText('"b"');
    expect(keyword.style.color).toMatch(/^rgb/);
    expect(string.style.color).toMatch(/^rgb/);
    expect(keyword.style.color).not.toBe(string.style.color);
  });

  it("puts each source line on its own line", async () => {
    await renderCode("a\n\nb", "plain text");
    const lines = screen
      .getByLabelText("Code, Plain text")
      .querySelectorAll("[data-line]");
    expect([...lines].map((l) => l.textContent)).toEqual(["a", "", "b"]);
  });

  it("copies the code with its copy button", async () => {
    await renderCode("const a = 1;\nconst b = 2;");
    await userEvent.click(screen.getByRole("button", { name: "Copy code" }));
    expect(copyText).toHaveBeenCalledWith("const a = 1;\nconst b = 2;");
  });

  it("shows the caption below the code", async () => {
    await renderCode("x", "typescript", "app.tsx");
    expect(screen.getByText("app.tsx").closest("figcaption")).not.toBeNull();
  });
});

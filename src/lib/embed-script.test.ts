import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "public/embed.js"), "utf8");

function setup() {
  document.body.innerHTML = "";
  const marked = document.createElement("iframe");
  marked.setAttribute("data-sanding", "");
  marked.style.height = "320px";
  const plain = document.createElement("iframe");
  plain.style.height = "320px";
  document.body.append(marked, plain);
  return { marked, plain };
}

function post(
  source: MessageEventSource | null,
  origin: string,
  data: unknown,
) {
  window.dispatchEvent(new MessageEvent("message", { data, origin, source }));
}

describe("embed.js", () => {
  beforeEach(() => {
    new Function(source)();
  });

  it("resizes the matching data-sanding iframe from the allowed origin", () => {
    const { marked } = setup();
    post(marked.contentWindow, "https://sanding.space", {
      type: "sanding:resize",
      height: 500,
    });
    expect(marked.style.height).toBe("500px");
  });

  it("never grows an iframe past its data-sanding-max-height", () => {
    const { marked } = setup();
    marked.setAttribute("data-sanding-max-height", "200");
    post(marked.contentWindow, "https://sanding.space", {
      type: "sanding:resize",
      height: 500,
    });
    expect(marked.style.height).toBe("200px");
  });

  it("ignores other origins", () => {
    const { marked } = setup();
    post(marked.contentWindow, "https://evil.example", {
      type: "sanding:resize",
      height: 500,
    });
    expect(marked.style.height).toBe("320px");
  });

  it("ignores frames without data-sanding", () => {
    const { plain } = setup();
    post(plain.contentWindow, "https://sanding.space", {
      type: "sanding:resize",
      height: 500,
    });
    expect(plain.style.height).toBe("320px");
  });

  it("ignores other message types and invalid heights", () => {
    const { marked } = setup();
    post(marked.contentWindow, "https://sanding.space", {
      type: "x",
      height: 500,
    });
    post(marked.contentWindow, "https://sanding.space", {
      type: "sanding:resize",
      height: -1,
    });
    post(marked.contentWindow, "https://sanding.space", {
      type: "sanding:resize",
      height: "500",
    });
    expect(marked.style.height).toBe("320px");
  });
});

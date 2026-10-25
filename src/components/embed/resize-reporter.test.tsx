import { render } from "@testing-library/react";
import { ResizeReporter } from "@/components/embed/resize-reporter";

let fire: () => void = () => {};

beforeEach(() => {
  fire = () => {};
  window.ResizeObserver = class {
    constructor(cb: () => void) {
      fire = cb;
    }
    observe() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    height: 319.6,
  } as DOMRect);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ResizeReporter", () => {
  it("posts the rounded height to the parent when framed", () => {
    const post = vi.fn();
    vi.spyOn(window, "parent", "get").mockReturnValue({
      postMessage: post,
    } as unknown as Window);
    vi.spyOn(window, "top", "get").mockReturnValue({} as Window);
    render(
      <ResizeReporter name="button-press-scale" minHeight={320}>
        <p>x</p>
      </ResizeReporter>,
    );
    fire();
    expect(post).toHaveBeenCalledWith(
      { type: "sanding:resize", name: "button-press-scale", height: 320 },
      "*",
    );
  });

  it("sets the root's min-height from the given entry height", () => {
    const { container } = render(
      <ResizeReporter name="button-press-scale" minHeight={320}>
        <p>x</p>
      </ResizeReporter>,
    );
    expect(container.firstElementChild).toHaveStyle({ minHeight: "320px" });
  });

  it("posts nothing at top level", () => {
    const post = vi.fn();
    vi.spyOn(window, "parent", "get").mockReturnValue({
      postMessage: post,
    } as unknown as Window);
    const me = {} as Window & typeof globalThis;
    vi.spyOn(window, "top", "get").mockReturnValue(me);
    vi.spyOn(window, "self", "get").mockReturnValue(me);
    render(
      <ResizeReporter name="button-press-scale" minHeight={320}>
        <p>x</p>
      </ResizeReporter>,
    );
    fire();
    expect(post).not.toHaveBeenCalled();
  });
});

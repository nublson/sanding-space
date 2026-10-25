import { act, render, screen } from "@testing-library/react";
import { LiveThumbnail } from "@/components/stage/live-thumbnail";

vi.mock("@/lib/demos", async (orig) => {
  const real = await orig<typeof import("@/lib/demos")>();
  const registry = {
    ...real.registry,
    "button-press-scale": {
      ...real.registry["button-press-scale"],
      aliases: ["old-name"],
    },
  };
  return {
    ...real,
    demos: real.deriveDemos(registry),
    resolveDemo: (n: string) => real.resolveDemoIn(registry, n),
  };
});

let fire: () => void = () => {};
beforeEach(() => {
  window.IntersectionObserver = class {
    constructor(cb: (r: { isIntersecting: boolean }[]) => void) {
      fire = () => cb([{ isIntersecting: true }]);
    }
    observe() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

describe("LiveThumbnail", () => {
  it("renders the demo only once in view", () => {
    render(
      <LiveThumbnail demo="button-press-scale" essaySlug="x" size="card" />,
    );
    expect(screen.queryByRole("button")).toBeNull();
    act(() => fire());
    expect(
      screen.getByRole("button", { name: /press and hold/i }),
    ).toBeInTheDocument();
  });
  it("resolves aliases to the target demo", () => {
    render(<LiveThumbnail demo="old-name" essaySlug="x" size="card" />);
    act(() => fire());
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
  it("renders an empty stage for unknown or null demos", () => {
    const { container, rerender } = render(
      <LiveThumbnail demo="nope" essaySlug="x" size="card" />,
    );
    expect(container.querySelector("[data-stream]")).toBeNull();
    expect(container.firstElementChild).toBeEmptyDOMElement();
    rerender(<LiveThumbnail demo={null} essaySlug="x" size="card" />);
    expect(container.firstElementChild).toBeEmptyDOMElement();
  });
});

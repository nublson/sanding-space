import { act, render, screen } from "@testing-library/react";
import { LiveThumbnail } from "@/components/stage/live-thumbnail";

vi.mock("@/lib/demo-meta", async (orig) =>
  (await import("@/test/fake-demos")).mockDemoMeta(orig),
);
vi.mock("@/components/demos/lazy-demo", async () =>
  (await import("@/test/fake-demos")).mockLazyDemo(),
);
vi.mock("@/components/demos/thumbnails", () => ({
  demoThumbnails: { "test-demo": () => <p>Static thumbnail</p> },
}));

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
  it("renders the demo only once in view", async () => {
    render(<LiveThumbnail demo="test-demo" essaySlug="x" size="card" />);
    expect(screen.queryByRole("button")).toBeNull();
    act(() => fire());
    expect(
      await screen.findByRole("button", { name: /press and hold/i }),
    ).toBeInTheDocument();
  });
  it("resolves aliases to the target demo", async () => {
    render(<LiveThumbnail demo="old-name" essaySlug="x" size="card" />);
    act(() => fire());
    expect(await screen.findByRole("button")).toBeInTheDocument();
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
  it("draws a demo's static thumbnail in cards, never the live demo", () => {
    render(
      <LiveThumbnail demo="test-demo" essaySlug="x" size="card" preview />,
    );
    act(() => fire());
    expect(screen.getByText("Static thumbnail")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("keeps the live demo on the essay stage", async () => {
    render(<LiveThumbnail demo="test-demo" essaySlug="x" size="essay" />);
    act(() => fire());
    expect(await screen.findByRole("button")).toBeInTheDocument();
    expect(screen.queryByText("Static thumbnail")).toBeNull();
  });
});

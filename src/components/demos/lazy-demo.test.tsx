import { act, render, screen } from "@testing-library/react";
import { type ComponentType, lazy } from "react";

// Every loader resolves when its test lets it, standing in for a chunk.
const chunks = vi.hoisted(() => {
  const gates = new Map<string, () => void>();
  // The loaders in the order lazy-demo.tsx declares them.
  const order = [
    "find-the-back",
    "paper-cuts",
    "sanded-button",
    "sanded-form",
    "search-expand",
    "surface",
  ];
  return {
    gates,
    next: () => order.shift() ?? "",
    wait(name: string) {
      return new Promise<void>((resolve) => gates.set(name, resolve));
    },
  };
});

vi.mock("next/dynamic", () => ({
  default: () => {
    const name = chunks.next();
    return lazy(async () => {
      await chunks.wait(name);
      const Demo: ComponentType<{ name: string }> = ({ name }) => (
        <p>{name} demo</p>
      );
      return { default: Demo };
    });
  },
}));

const { LazyDemo } = await import("@/components/demos/lazy-demo");

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("LazyDemo", () => {
  it("fades a demo in itself when its chunk lands after a long wait", async () => {
    render(<LazyDemo name="surface" params={{}} />);
    await act(async () => vi.advanceTimersByTime(150));
    await act(async () => chunks.gates.get("surface")?.());
    const demo = screen.getByText("surface demo");
    expect(demo.closest("[data-stream-late]")).not.toBeNull();
  });

  it("leaves a demo whose chunk lands at once to its parent's fade", async () => {
    render(<LazyDemo name="paper-cuts" params={{}} />);
    await act(async () => chunks.gates.get("paper-cuts")?.());
    const demo = screen.getByText("paper-cuts demo");
    expect(demo.closest("[data-stream-late]")).toBeNull();
  });

  it("renders nothing for an unknown name", () => {
    const { container } = render(<LazyDemo name="nope" params={{}} />);
    expect(container).toBeEmptyDOMElement();
  });
});

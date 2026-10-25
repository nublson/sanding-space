import { act, render, screen } from "@testing-library/react";
import { InViewMount } from "@/components/stage/in-view-mount";

let fire: (v: boolean) => void = () => {};
const disconnect = vi.fn();

beforeEach(() => {
  disconnect.mockClear();
  window.IntersectionObserver = class {
    constructor(cb: (r: { isIntersecting: boolean }[]) => void) {
      fire = (v) => cb([{ isIntersecting: v }]);
    }
    observe() {}
    disconnect = disconnect;
  } as unknown as typeof IntersectionObserver;
});

describe("InViewMount", () => {
  it("mounts children only after intersecting, then disconnects", () => {
    render(
      <InViewMount>
        <p>demo</p>
      </InViewMount>,
    );
    expect(screen.queryByText("demo")).toBeNull();
    act(() => fire(false));
    expect(screen.queryByText("demo")).toBeNull();
    act(() => fire(true));
    expect(screen.getByText("demo")).toBeInTheDocument();
    expect(disconnect).toHaveBeenCalled();
  });
});

import { act, render } from "@testing-library/react";
import { NavMarker } from "@/components/nav-marker";

afterEach(() => {
  vi.useRealTimers();
  delete document.documentElement.dataset.nav;
});

test("marks the document once the first-load entrance has played", () => {
  vi.useFakeTimers();
  render(<NavMarker />);
  expect(document.documentElement.dataset.nav).toBeUndefined();
  act(() => vi.advanceTimersByTime(999));
  expect(document.documentElement.dataset.nav).toBeUndefined();
  act(() => vi.advanceTimersByTime(1));
  expect(document.documentElement.dataset.nav).toBe("client");
});

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { essay } from "./test-items";
import { ToggleDot } from "./toggle-dot";
import { resetAnnouncementStore, STORAGE_KEY } from "./use-announcement";

vi.mock("next/navigation", () => ({ usePathname: () => "/spring" }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-09T12:00:00Z"));
  localStorage.clear();
  resetAnnouncementStore();
});
afterEach(() => vi.useRealTimers());

describe("ToggleDot", () => {
  it("shows a dot and names it while the announcement is unseen", () => {
    const { container } = render(<ToggleDot items={[essay]} />);
    expect(container.querySelector("[data-slot=toggle-dot]")).not.toBeNull();
    expect(screen.getByText(", new announcement")).toHaveClass("sr-only");
  });

  it("grows in from half size as it fades in", () => {
    const { container } = render(<ToggleDot items={[essay]} />);
    expect(container.querySelector("[data-slot=toggle-dot]")).toHaveClass(
      "starting:scale-50",
      "starting:opacity-0",
      "duration-200",
    );
  });

  it("is gone once the card has been noticed", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ layout: "noticed" }));
    resetAnnouncementStore();
    const { container } = render(<ToggleDot items={[essay]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("is gone with nothing to announce", () => {
    const { container } = render(<ToggleDot items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

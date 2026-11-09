import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BottomBar } from "./bottom-bar";
import { essay, promo } from "./test-items";
import { resetAnnouncementStore } from "./use-announcement";

vi.mock("next/navigation", () => ({ usePathname: () => "/spring" }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-09T12:00:00Z"));
  localStorage.clear();
  resetAnnouncementStore();
});
afterEach(() => vi.useRealTimers());

const marker = () => document.querySelector("[data-slot=marker]");

describe("BottomBar", () => {
  it("renders the essay item with no action text", () => {
    render(<BottomBar items={[essay]} />);
    expect(screen.getByRole("link", { name: "Layout" })).toHaveAttribute(
      "href",
      "/layout",
    );
    expect(screen.queryByText("Read")).toBeNull();
  });

  it("renders an external item in a new tab with no action text", () => {
    render(<BottomBar items={[promo]} />);
    const link = screen.getByRole("link", {
      name: "Interfaces (opens in a new tab)",
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.queryByText("Visit")).toBeNull();
  });

  it("opens from anywhere on the bar", () => {
    render(<BottomBar items={[essay]} />);
    expect(screen.getByRole("link", { name: "Layout" })).toHaveClass(
      "after:absolute",
      "after:inset-0",
    );
  });

  it("centers the close button on the whole bar", () => {
    render(<BottomBar items={[essay]} />);
    expect(screen.getByRole("button", { name: "Dismiss Layout" })).toHaveClass(
      "col-start-3",
      "row-span-2",
      "row-start-1",
      "self-center",
    );
  });

  it("hangs the favicon on the title's line", () => {
    render(<BottomBar items={[promo]} />);
    expect(marker()).toHaveClass("row-start-1", "h-lh", "text-sm/[18px]");
  });

  it("puts a promo's description on the title's row, right after it", () => {
    render(<BottomBar items={[promo]} />);
    const description = screen.getByText("A magazine.");
    const link = screen.getByRole("link", {
      name: "Interfaces (opens in a new tab)",
    });
    // One text run: favicon, then title, then description, wrapping whole.
    expect(description.parentElement).toBe(link.parentElement);
    expect(link.parentElement).toHaveClass("col-start-2", "row-start-1");
    expect(description).not.toHaveClass("truncate");
    expect(marker()).toHaveClass("row-start-1");
  });

  it("leaves an essay's summary to the essay page", () => {
    render(<BottomBar items={[essay]} />);
    expect(screen.queryByText("Why a box that jumps feels broken.")).toBeNull();
  });

  it("gives the close button a 44px touch target", () => {
    render(<BottomBar items={[essay]} />);
    expect(screen.getByRole("button", { name: "Dismiss Layout" })).toHaveClass(
      "pointer-coarse:after:-inset-3.5",
    );
  });

  it("close button is not inside the link", () => {
    render(<BottomBar items={[essay]} />);
    const link = screen.getByRole("link", { name: "Layout" });
    const button = screen.getByRole("button", { name: "Dismiss Layout" });
    expect(link.contains(button)).toBe(false);
  });

  it("dismiss removes it and focuses main", () => {
    render(
      <>
        <BottomBar items={[essay]} />
        <main id="main-content" tabIndex={-1} />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Dismiss Layout" }));
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByRole("region", { name: "New essay" })).toBeNull();
    expect(document.activeElement).toBe(
      document.getElementById("main-content"),
    );
  });

  it("presses in and stays put across route transitions", () => {
    render(<BottomBar items={[essay]} />);
    const region = screen.getByRole("region", { name: "New essay" });
    expect(region).toHaveClass("has-[a:active]:scale-[0.98]");
    expect(region).toHaveClass("announcement-bar");
  });

  it("wraps a long title instead of cutting it off", () => {
    render(<BottomBar items={[promo]} />);
    const region = screen.getByRole("region", { name: "Announcement" });
    expect(region).toHaveClass("min-h-14");
    expect(region).not.toHaveClass("h-14");
    expect(screen.getByText("Interfaces")).not.toHaveClass("truncate");
  });

  it("keeps the tag pill in the one-row run, before the title", () => {
    render(<BottomBar items={[{ ...promo, tag: "Beta" }]} />);
    const link = screen.getByRole("link", {
      name: "Beta Interfaces (opens in a new tab)",
    });
    expect(link).toContainElement(screen.getByText("Beta"));
    expect(screen.getByText("A magazine.").parentElement).toBe(
      link.parentElement,
    );
  });

  it("hidden on desktop", () => {
    render(<BottomBar items={[essay]} />);
    expect(screen.getByRole("region", { name: "New essay" })).toHaveClass(
      "md:hidden",
    );
  });
});

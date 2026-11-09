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

  it("lines the close icon up with the essay dot", () => {
    render(<BottomBar items={[essay]} />);
    expect(marker()).toHaveClass("row-start-1");
    expect(screen.getByRole("button", { name: "Dismiss Layout" })).toHaveClass(
      "col-start-3",
      "row-start-1",
    );
  });

  it("lines the close icon up with a promo's favicon", () => {
    render(<BottomBar items={[{ ...promo, label: "Also by me" }]} />);
    expect(marker()).toHaveClass("row-start-2");
    expect(
      screen.getByRole("button", { name: "Dismiss Interfaces" }),
    ).toHaveClass("row-start-2");
  });

  it("hangs both icons on the title's first line", () => {
    render(<BottomBar items={[promo]} />);
    expect(marker()).toHaveClass("h-lh", "text-sm/[18px]");
    expect(
      screen.getByRole("button", { name: "Dismiss Interfaces" }),
    ).toHaveClass("h-lh", "text-sm/[18px]");
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

  it("hidden on desktop", () => {
    render(<BottomBar items={[essay]} />);
    expect(screen.getByRole("region", { name: "New essay" })).toHaveClass(
      "md:hidden",
    );
  });
});

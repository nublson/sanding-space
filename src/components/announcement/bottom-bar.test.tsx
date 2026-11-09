import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnnouncementItem } from "@/lib/content/announcement";
import { BottomBar } from "./bottom-bar";
import { resetAnnouncementStore } from "./use-announcement";

vi.mock("next/navigation", () => ({ usePathname: () => "/spring" }));

const essay: AnnouncementItem = {
  kind: "essay",
  id: "layout",
  title: "Layout",
  summary: "S",
  href: "/layout",
  label: "New essay",
  icon: null,
  startsAt: null,
  expiresAt: "2026-11-15T00:00:00.000Z",
};
const promo: AnnouncementItem = {
  kind: "external",
  id: "p1",
  title: "Interfaces",
  summary: "A magazine.",
  href: "https://interfaces.example",
  label: null,
  icon: null,
  startsAt: null,
  expiresAt: null,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-09T12:00:00Z"));
  localStorage.clear();
  resetAnnouncementStore();
});
afterEach(() => vi.useRealTimers());

describe("BottomBar", () => {
  it("renders the essay item with Read", () => {
    render(<BottomBar items={[essay]} />);
    const link = screen.getByRole("link", { name: "New essay Layout Read" });
    expect(link).toHaveAttribute("href", "/layout");
    expect(link).toHaveTextContent("Read");
  });

  it("renders an external item with Visit in a new tab", () => {
    render(<BottomBar items={[promo]} />);
    const link = screen.getByRole("link", {
      name: "Interfaces Visit (opens in a new tab)",
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveTextContent("Visit");
  });

  it("puts the essay dot on the New essay line", () => {
    render(<BottomBar items={[essay]} />);
    const marker = screen
      .getByRole("link", { name: "New essay Layout Read" })
      .querySelector("[data-slot=marker]");
    expect(marker?.nextElementSibling).toBe(screen.getByText("New essay"));
    expect(screen.getByText("Layout")).toHaveClass("col-start-2");
  });

  it("hangs a promo's favicon on the title's line", () => {
    render(<BottomBar items={[{ ...promo, label: "Also by me" }]} />);
    const marker = screen
      .getByRole("link", {
        name: "Also by me Interfaces Visit (opens in a new tab)",
      })
      .querySelector("[data-slot=marker]");
    expect(marker?.nextElementSibling).toBe(screen.getByText("Interfaces"));
    expect(screen.getByText("Also by me")).toHaveClass("col-start-2");
  });

  it("close button is not inside the link", () => {
    render(<BottomBar items={[essay]} />);
    const link = screen.getByRole("link", { name: "New essay Layout Read" });
    const close = screen.getByRole("button", { name: "Dismiss Layout" });
    expect(link.contains(close)).toBe(false);
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

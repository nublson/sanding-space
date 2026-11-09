import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarCard } from "./sidebar-card";
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
const close = (name = "Dismiss Layout") => screen.getByRole("button", { name });

describe("SidebarCard", () => {
  it("renders the essay item, its title as the link", () => {
    render(<SidebarCard items={[essay]} />);
    const region = screen.getByRole("region", { name: "New essay" });
    const link = screen.getByRole("link", { name: "Layout" });
    expect(link).toHaveAttribute("href", "/layout");
    expect(link).not.toHaveAttribute("target");
    expect(region).toHaveTextContent("Why a box that jumps feels broken.");
  });

  it("renders an external item in a new tab", () => {
    const { container } = render(<SidebarCard items={[promo]} />);
    const link = screen.getByRole("link", {
      name: "Interfaces (opens in a new tab)",
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("shows no label for a promo without one", () => {
    render(<SidebarCard items={[promo]} />);
    expect(screen.getByRole("region", { name: "Announcement" })).toBeVisible();
    expect(screen.queryByText("From the author")).toBeNull();
  });

  it("opens from anywhere on the card", () => {
    render(<SidebarCard items={[essay]} />);
    expect(screen.getByRole("link", { name: "Layout" })).toHaveClass(
      "after:absolute",
      "after:inset-0",
    );
    expect(screen.getByRole("region", { name: "New essay" })).toHaveClass(
      "relative",
    );
  });

  it("lines the close icon up with the essay dot on the New essay row", () => {
    render(<SidebarCard items={[essay]} />);
    expect(marker()).toHaveClass("col-start-1", "row-start-1");
    expect(close()).toHaveClass("col-start-3", "row-start-1");
    expect(screen.getByText("New essay")).toHaveClass("row-start-1");
    expect(screen.getByRole("link", { name: "Layout" })).toHaveClass(
      "row-start-2",
    );
  });

  it("lines the close icon up with a promo's favicon on the title row", () => {
    render(<SidebarCard items={[promo]} />);
    expect(marker()).toHaveClass("row-start-1");
    expect(close("Dismiss Interfaces")).toHaveClass("row-start-1");
    expect(
      screen.getByRole("link", { name: "Interfaces (opens in a new tab)" }),
    ).toHaveClass("row-start-1");
    expect(screen.getByText("A magazine.")).toHaveClass("row-start-2");
  });

  it("hangs both icons on the first line, however the title wraps", () => {
    render(<SidebarCard items={[essay]} />);
    expect(screen.getByRole("region", { name: "New essay" })).toHaveClass(
      "items-start",
    );
    // One line of the New essay row tall, so each centers on that line.
    expect(marker()).toHaveClass("h-lh", "text-xs/[18px]");
    expect(close()).toHaveClass("h-lh", "text-xs/[18px]");
  });

  it("close button is not inside the link", () => {
    render(<SidebarCard items={[essay]} />);
    const link = screen.getByRole("link", { name: "Layout" });
    expect(link.contains(close())).toBe(false);
  });

  it("dismiss removes it and focuses Resources", () => {
    render(
      <>
        <SidebarCard items={[essay]} />
        <a href="/resources">Resources</a>
      </>,
    );
    fireEvent.click(close());
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByRole("region", { name: "New essay" })).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole("link", { name: "Resources" }),
    );
  });

  it("fades in from its first paint", () => {
    render(<SidebarCard items={[essay]} />);
    const region = screen.getByRole("region", { name: "New essay" });
    expect(region).toHaveClass("starting:opacity-0", "starting:translate-y-2");
  });

  it("keeps the fade under reduced motion, dropping only the lift", () => {
    render(<SidebarCard items={[essay]} />);
    const region = screen.getByRole("region", { name: "New essay" });
    expect(region.className).not.toContain("motion-reduce:transition-none");
    expect(region).toHaveClass("motion-reduce:starting:translate-y-0");
  });

  it("answers hover quickly, and only on devices that hover", () => {
    render(<SidebarCard items={[essay]} />);
    const region = screen.getByRole("region", { name: "New essay" });
    expect(region).toHaveClass("duration-[300ms,300ms,160ms,150ms]");
    expect(region).toHaveClass(
      "[@media(hover:hover)_and_(pointer:fine)]:has-[a:hover]:border-input",
    );
  });

  it("presses in with the link", () => {
    render(<SidebarCard items={[essay]} />);
    expect(screen.getByRole("region", { name: "New essay" })).toHaveClass(
      "has-[a:active]:scale-[0.98]",
    );
  });

  it("draws the focus ring around the whole card", () => {
    render(<SidebarCard items={[essay]} />);
    expect(screen.getByRole("region", { name: "New essay" })).toHaveClass(
      "has-[a:focus-visible]:outline-2",
    );
    expect(screen.getByRole("link", { name: "Layout" })).toHaveClass(
      "focus-visible:outline-none",
    );
  });

  it("shows a promo's whole description, clamping only an essay's", () => {
    const { unmount } = render(<SidebarCard items={[promo]} />);
    expect(screen.getByText("A magazine.")).not.toHaveClass("line-clamp-2");
    unmount();
    render(<SidebarCard items={[essay]} />);
    expect(screen.getByText("Why a box that jumps feels broken.")).toHaveClass(
      "line-clamp-2",
    );
  });

  it("outlines the favicon so dark icons keep an edge", () => {
    const { container } = render(<SidebarCard items={[promo]} />);
    expect(container.querySelector("img")).toHaveClass(
      "outline-(--image-outline)",
    );
  });

  it("lines its icons up with the sidebar's: marker under the logo, close under the mute icon", () => {
    render(<SidebarCard items={[essay]} />);
    // 13px = 12px padding + 1px border: the marker column starts on the
    // sidebar's text edge. 20px end padding puts the close icon's center on
    // the mute button's (a 32px button, 8px in from the column's end).
    expect(screen.getByRole("region", { name: "New essay" })).toHaveClass(
      "-mx-[13px]",
      "pe-5",
    );
  });

  it("puts a promo's tag on its own quiet line above the title", () => {
    render(<SidebarCard items={[{ ...promo, label: "New" }]} />);
    const tag = screen.getByText("New");
    expect(tag).toHaveClass(
      "col-start-2",
      "row-start-1",
      "text-subtle-foreground",
    );
    const link = screen.getByRole("link", {
      name: "Interfaces (opens in a new tab)",
    });
    expect(link).not.toContainElement(tag);
    expect(link).toHaveClass("row-start-2");
    // The favicon and the close icon stay on the title's line.
    expect(marker()).toHaveClass("row-start-2");
    expect(close("Dismiss Interfaces")).toHaveClass("row-start-2");
  });

  it("draws no pill", () => {
    const { container } = render(
      <SidebarCard items={[{ ...promo, label: "New" }]} />,
    );
    expect(container.querySelector("[data-slot=tag]")).toBeNull();
    expect(container.querySelector(".rounded-full.border")).toBeNull();
  });

  it("hidden on mobile", () => {
    render(<SidebarCard items={[essay]} />);
    expect(screen.getByRole("region", { name: "New essay" })).toHaveClass(
      "max-md:hidden",
    );
  });
});

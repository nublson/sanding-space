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

  it("has no close button: opening it is the only way out", () => {
    render(<SidebarCard items={[promo]} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("puts the essay dot on the New essay row", () => {
    render(<SidebarCard items={[essay]} />);
    expect(marker()).toHaveClass("col-start-1", "row-start-1", "h-lh");
    expect(screen.getByText("New essay")).toHaveClass("row-start-1");
    expect(screen.getByRole("link", { name: "Layout" })).toHaveClass(
      "row-start-2",
    );
  });

  it("hangs a promo's favicon on the title's first line", () => {
    render(<SidebarCard items={[promo]} />);
    expect(marker()).toHaveClass("row-start-1", "h-lh");
    expect(
      screen.getByRole("link", { name: "Interfaces (opens in a new tab)" }),
    ).toHaveClass("row-start-1");
    expect(screen.getByText("A magazine.")).toHaveClass("row-start-2");
  });

  it("opening a promo marks it read and fades the card out", () => {
    render(
      <>
        <SidebarCard items={[promo]} />
        <a href="/resources">Resources</a>
      </>,
    );
    fireEvent.click(
      screen.getByRole("link", { name: "Interfaces (opens in a new tab)" }),
    );
    expect(
      JSON.parse(localStorage.getItem("sanding-space:announcement") ?? "{}"),
    ).toEqual({ p1: "read" });
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByRole("region", { name: "Announcement" })).toBeNull();
    // Focus moves on instead of being lost with the card.
    expect(document.activeElement).toBe(
      screen.getByRole("link", { name: "Resources" }),
    );
  });

  it("opening an essay marks it read", () => {
    render(<SidebarCard items={[essay]} />);
    fireEvent.click(screen.getByRole("link", { name: "Layout" }));
    expect(
      JSON.parse(localStorage.getItem("sanding-space:announcement") ?? "{}"),
    ).toEqual({ layout: "read" });
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
    expect(region).toHaveClass("duration-[250ms,250ms,160ms,150ms]");
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

  it("reaches past the column so its marker sits on the logo's edge", () => {
    render(<SidebarCard items={[essay]} />);
    // 13px = 12px padding + 1px border: the marker column starts on the
    // sidebar's text edge.
    expect(screen.getByRole("region", { name: "New essay" })).toHaveClass(
      "-mx-[13px]",
    );
  });

  it("stays inside the mobile sidebar", () => {
    render(<SidebarCard items={[essay]} />);
    expect(screen.getByRole("region", { name: "New essay" })).toHaveClass(
      "max-md:me-0",
    );
  });

  it("staggers label, title and summary in, 40ms apart", () => {
    render(<SidebarCard items={[essay]} />);
    const label = screen.getByText("New essay");
    const title = screen.getByRole("link", { name: "Layout" });
    const summary = screen.getByText("Why a box that jumps feels broken.");
    for (const node of [label, title, summary]) {
      expect(node).toHaveClass("starting:opacity-0", "starting:translate-y-1");
    }
    expect(label).toHaveClass("delay-0");
    expect(title).toHaveClass("delay-[40ms]");
    expect(summary).toHaveClass("delay-[80ms]");
  });

  it("shows at every width, inside the mobile sidebar too", () => {
    render(<SidebarCard items={[essay]} />);
    expect(
      screen.getByRole("region", { name: "New essay" }).className,
    ).not.toContain("max-md:hidden");
  });

  it("marks itself noticed once it is on screen", () => {
    let callback: IntersectionObserverCallback = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    render(<SidebarCard items={[essay]} />);
    expect(localStorage.getItem("sanding-space:announcement")).toBeNull();
    act(() =>
      callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
    expect(
      JSON.parse(localStorage.getItem("sanding-space:announcement") ?? "{}"),
    ).toEqual({ layout: "noticed" });
    vi.unstubAllGlobals();
  });
});

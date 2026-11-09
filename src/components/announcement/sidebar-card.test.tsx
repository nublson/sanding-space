import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnnouncementItem } from "@/lib/content/announcement";
import { SidebarCard } from "./sidebar-card";
import { resetAnnouncementStore } from "./use-announcement";

vi.mock("next/navigation", () => ({ usePathname: () => "/spring" }));

const essay: AnnouncementItem = {
  kind: "essay",
  id: "layout",
  title: "Layout",
  summary: "Why a box that jumps feels broken.",
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
  label: "From the author",
  icon: "data:image/png;base64,AA==",
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

describe("SidebarCard", () => {
  it("renders the essay item", () => {
    render(<SidebarCard items={[essay]} />);
    expect(screen.getByRole("region", { name: "New essay" })).toBeVisible();
    const link = screen.getByRole("link", { name: "New essay: Layout" });
    expect(link).toHaveAttribute("href", "/layout");
    expect(link).not.toHaveAttribute("target");
    expect(link).toHaveTextContent("Why a box that jumps feels broken.");
  });

  it("renders an external item in a new tab", () => {
    const { container } = render(<SidebarCard items={[promo]} />);
    const link = screen.getByRole("link", {
      name: "From the author: Interfaces (opens in a new tab)",
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("close button is not inside the link", () => {
    render(<SidebarCard items={[essay]} />);
    const link = screen.getByRole("link", { name: "New essay: Layout" });
    const close = screen.getByRole("button", { name: "Dismiss Layout" });
    expect(link.contains(close)).toBe(false);
  });

  it("dismiss removes it and focuses Resources", () => {
    render(
      <>
        <SidebarCard items={[essay]} />
        <a href="/resources">Resources</a>
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Dismiss Layout" }));
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

  it("hidden on mobile", () => {
    render(<SidebarCard items={[essay]} />);
    expect(screen.getByRole("region", { name: "New essay" })).toHaveClass(
      "max-md:hidden",
    );
  });
});

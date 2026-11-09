import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnnouncementItem } from "@/lib/content/announcement";
import {
  resetAnnouncementStore,
  STORAGE_KEY,
  useAnnouncement,
} from "./use-announcement";

let pathname = "/spring";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

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
  label: "From the author",
  icon: null,
  startsAt: null,
  expiresAt: null,
};

const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-09T12:00:00Z"));
  localStorage.clear();
  resetAnnouncementStore();
  pathname = "/spring";
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useAnnouncement", () => {
  it("starts pending", () => {
    const phases: string[] = [];
    renderHook(() => {
      const r = useAnnouncement([essay]);
      phases.push(r.phase);
      return r;
    });
    expect(phases[0]).toBe("pending");
  });

  it("shows the essay on another page", () => {
    const { result } = renderHook(() => useAnnouncement([essay]));
    expect(result.current.phase).toBe("shown");
    expect(result.current.item?.id).toBe("layout");
  });

  it("prefers a live promotion over the essay", () => {
    const { result } = renderHook(() => useAnnouncement([promo, essay]));
    expect(result.current.item?.id).toBe("p1");
  });

  it("skips items outside their window", () => {
    const later = { ...promo, startsAt: "2026-11-10T00:00:00.000Z" };
    const { result } = renderHook(() => useAnnouncement([later, essay]));
    expect(result.current.item?.id).toBe("layout");

    const expired = { ...essay, expiresAt: "2026-11-01T00:00:00.000Z" };
    const { result: none } = renderHook(() => useAnnouncement([expired]));
    expect(none.current.phase).toBe("hidden");
  });

  it("dismiss persists per id", () => {
    const { result } = renderHook(() => useAnnouncement([promo]));
    act(() => result.current.dismiss());
    expect(result.current.phase).toBe("leaving");
    expect(stored()).toEqual({ p1: "dismissed" });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current.phase).toBe("hidden");

    resetAnnouncementStore();
    const { result: again } = renderHook(() => useAnnouncement([promo]));
    expect(again.current.phase).toBe("hidden");
  });

  it("a dismissed promo does not hide the essay on the next path", () => {
    const items = [promo, essay];
    const { result, rerender } = renderHook(() => useAnnouncement(items));
    act(() => result.current.dismiss());
    act(() => vi.advanceTimersByTime(200));
    rerender();
    expect(result.current.phase).toBe("hidden");

    pathname = "/other";
    rerender();
    expect(result.current.phase).toBe("shown");
    expect(result.current.item?.id).toBe("layout");
  });

  it("marks the essay read on its own path, trailing slash included", () => {
    pathname = "/layout/";
    const { result } = renderHook(() => useAnnouncement([essay]));
    expect(result.current.phase).toBe("hidden");
    expect(stored()).toEqual({ layout: "read" });

    pathname = "/spring";
    const { result: later } = renderHook(() => useAnnouncement([essay]));
    expect(later.current.phase).toBe("hidden");
  });

  it("two hooks share a dismissal", () => {
    const { result } = renderHook(() => ({
      card: useAnnouncement([essay]),
      bar: useAnnouncement([essay]),
    }));
    act(() => result.current.card.dismiss());
    expect(result.current.bar.phase).toBe("hidden");
  });

  it("works when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = renderHook(() => useAnnouncement([essay]));
    expect(result.current.phase).toBe("shown");
    act(() => result.current.dismiss());
    act(() => vi.advanceTimersByTime(200));
    expect(result.current.phase).toBe("hidden");
  });

  it("still fades out with reduced motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi
        .fn()
        .mockReturnValue({ matches: true }) as unknown as typeof matchMedia,
    );
    const { result } = renderHook(() => useAnnouncement([essay]));
    act(() => result.current.dismiss());
    act(() => vi.advanceTimersByTime(0));
    expect(result.current.phase).toBe("leaving");
    act(() => vi.advanceTimersByTime(200));
    expect(result.current.phase).toBe("hidden");
  });

  it("caps storage at 50 entries", () => {
    const full = Object.fromEntries(
      Array.from({ length: 50 }, (_, i) => [`old-${i}`, "dismissed"]),
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
    resetAnnouncementStore();
    const { result } = renderHook(() => useAnnouncement([essay]));
    act(() => result.current.dismiss());
    const after = stored();
    expect(Object.keys(after)).toHaveLength(50);
    expect(after["old-0"]).toBeUndefined();
    expect(after.layout).toBe("dismissed");
  });
});

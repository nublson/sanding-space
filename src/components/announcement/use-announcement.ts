"use client";

import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { type AnnouncementItem, isLive } from "@/lib/content/announcement";

export const STORAGE_KEY = "sanding-space:announcement";
const MAX_ENTRIES = 50;
const LEAVE_MS = 200;

/*
 * "noticed": the reader has seen the card (it was on screen), which clears
 * the dot on the mobile sidebar toggle but keeps the card. "read" (the card
 * was opened, or the essay's page visited) hides it; "dismissed" comes from
 * the old close button and hides it too.
 */
type Seen = Record<string, "dismissed" | "read" | "noticed">;
const hides = (state: Seen[string] | undefined) =>
  state === "dismissed" || state === "read";
const EMPTY: Seen = {};

/*
 * What this reader has closed, read or noticed, per item id. One copy in
 * memory, shared by the card and the toggle dot, and kept for the visit even
 * when localStorage is unavailable.
 */
let memory: Seen | null = null;
const listeners = new Set<() => void>();

function load(): Seen {
  if (memory) return memory;
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "{}",
    );
    memory =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Seen)
        : {};
  } catch {
    memory = {};
  }
  return memory;
}

function write(id: string, state: Seen[string]) {
  const current = load();
  if (current[id] === state) return;
  // Re-inserted last, so the oldest entries are the first keys to drop.
  const { [id]: _, ...rest } = current;
  const next: Seen = { ...rest, [id]: state };
  const keys = Object.keys(next);
  for (const key of keys.slice(0, keys.length - MAX_ENTRIES)) delete next[key];
  memory = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or blocked storage: the memory copy still holds it.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Tests only: forget the memory copy so the next read comes from storage. */
export function resetAnnouncementStore() {
  memory = null;
}

export type AnnouncementPhase = "pending" | "shown" | "leaving" | "hidden";

/**
 * Which announcement to show, chosen in the browser after mount and again on
 * each navigation: the first item within its dates that this reader hasn't
 * closed or read, never an essay on its own page (visiting it marks it read).
 * A close is not followed by the next item until the reader navigates.
 */
export function useAnnouncement(items: AnnouncementItem[]): {
  phase: AnnouncementPhase;
  item: AnnouncementItem | null;
  /** The reader opened it: marks it read and fades it out. */
  open: () => void;
  /** Whether this reader has already seen the card (clears the toggle dot). */
  noticed: boolean;
  /** Record that the card has been on screen; never undoes a read. */
  notice: () => void;
} {
  const path = usePathname().replace(/\/$/, "");
  const seen = useSyncExternalStore(subscribe, load, () => EMPTY);
  // undefined until mounted: the server and the first render show nothing.
  const [chosen, setChosen] = useState<AnnouncementItem | null | undefined>();
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Choose again when the items really change, not when a re-render hands
  // over an equal array: that would bring the next item right after a close.
  const latest = useRef(items);
  latest.current = items;
  const itemsKey = items
    .map((i) => `${i.id} ${i.startsAt} ${i.expiresAt}`)
    .join("|");

  // biome-ignore lint/correctness/useExhaustiveDependencies: itemsKey stands for items (read through the ref).
  useEffect(() => {
    // A leave still fading out from the last page must not clear the item
    // chosen for this one.
    clearTimeout(timer.current);
    const items = latest.current;
    const ownPage = (i: AnnouncementItem) =>
      i.kind === "essay" && i.href === path;
    const open = items.find(ownPage);
    if (open) write(open.id, "read");
    const now = Date.now();
    const current = load();
    setChosen(
      items.find(
        (i) => isLive(i, now) && !hides(current[i.id]) && !ownPage(i),
      ) ?? null,
    );
    setLeaving(false);
  }, [itemsKey, path]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const open = useCallback(() => {
    if (!chosen) return;
    write(chosen.id, "read");
    setLeaving(true);
    clearTimeout(timer.current);
    // The fade out runs under reduced motion too (only the lift is dropped).
    timer.current = setTimeout(() => {
      setLeaving(false);
      setChosen(null);
    }, LEAVE_MS);
  }, [chosen]);

  const notice = useCallback(() => {
    if (chosen && !load()[chosen.id]) write(chosen.id, "noticed");
  }, [chosen]);

  const phase: AnnouncementPhase =
    chosen === undefined
      ? "pending"
      : chosen === null
        ? "hidden"
        : leaving
          ? "leaving"
          : hides(seen[chosen.id])
            ? "hidden" // closed elsewhere on the page
            : "shown";

  return {
    phase,
    item: chosen ?? null,
    open,
    noticed: Boolean(chosen && seen[chosen.id] === "noticed"),
    notice,
  };
}

"use client";

import type { AnnouncementItem } from "@/lib/content/announcement";
import { useAnnouncement } from "./use-announcement";

/**
 * A dot on the mobile sidebar toggle while there is an announcement this
 * reader hasn't seen: it points into the sidebar, where the card is. Seeing
 * the card (opening the sidebar) clears it. The visually hidden text joins
 * the toggle's name: "Toggle sidebar, new announcement".
 */
export function ToggleDot({ items }: { items: AnnouncementItem[] }) {
  const { phase, noticed } = useAnnouncement(items);
  if (phase !== "shown" || noticed) return null;
  return (
    <>
      <span
        data-slot="toggle-dot"
        aria-hidden
        className="absolute top-3 right-3 size-1.5 rounded-full bg-foreground ring-2 ring-background transition-[opacity,scale] duration-200 ease-(--ease-out) starting:scale-50 starting:opacity-0 motion-reduce:starting:scale-100"
      />
      <span className="sr-only">, new announcement</span>
    </>
  );
}

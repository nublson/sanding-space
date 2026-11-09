"use client";

import { ArrowRight, ArrowUpRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnnouncementItem } from "@/lib/content/announcement";
import {
  AnnouncementHeading,
  AnnouncementLink,
  phaseProps,
} from "./announcement-link";
import { useAnnouncement } from "./use-announcement";

/**
 * The announcement on mobile: a bar floating above the bottom edge, over the
 * essay, so appearing never moves the page. One step lighter than a card so
 * it reads as floating; no shadow.
 */
export function BottomBar({ items }: { items: AnnouncementItem[] }) {
  const { phase, item, dismiss } = useAnnouncement(items);
  if (phase === "hidden" || !item) return null;
  const Arrow = item.kind === "essay" ? ArrowRight : ArrowUpRight;
  return (
    <section
      aria-label={item.label ?? "Announcement"}
      {...phaseProps(
        phase,
        "announcement-bar fixed right-[calc(12px+env(safe-area-inset-right))] bottom-[calc(16px+env(safe-area-inset-bottom))] left-[calc(12px+env(safe-area-inset-left))] z-20 flex h-14 items-center rounded-xl border border-[color-mix(in_oklch,var(--border),var(--foreground)_10%)] bg-[color-mix(in_oklch,var(--card),var(--foreground)_2%)] pe-1 md:hidden",
      )}
    >
      <AnnouncementLink
        item={item}
        className="grid h-full min-w-0 flex-1 grid-cols-[1rem_minmax(0,1fr)_auto] content-center items-center gap-x-2.5 ps-3.5"
      >
        <AnnouncementHeading
          item={item}
          labelClassName="text-subtle-foreground text-xs/[18px]"
          titleClassName="truncate font-medium text-foreground text-sm/[18px]"
        />
        <span className="col-start-3 row-span-2 row-start-1 flex items-center gap-0.5 text-[13px] text-foreground">
          {item.kind === "essay" ? "Read" : "Visit"}
          <Arrow className="size-3.5" aria-hidden />
        </span>
      </AnnouncementLink>
      <Button
        aria-label={`Dismiss ${item.title}`}
        data-sound="tap"
        className="ms-1 pointer-coarse:size-11"
        onClick={() => {
          dismiss();
          document.getElementById("main-content")?.focus();
        }}
      >
        <X />
      </Button>
    </section>
  );
}

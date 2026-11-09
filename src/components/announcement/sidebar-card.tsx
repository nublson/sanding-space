"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnnouncementItem } from "@/lib/content/announcement";
import {
  AnnouncementLink,
  AnnouncementMarker,
  phaseProps,
} from "./announcement-link";
import { useAnnouncement } from "./use-announcement";

/**
 * The announcement on desktop: a card in the sidebar footer, above
 * Resources. Its height comes out of the scrolling list, never the content.
 * Below md the bottom bar shows it instead.
 */
export function SidebarCard({ items }: { items: AnnouncementItem[] }) {
  const { phase, item, dismiss } = useAnnouncement(items);
  if (phase === "hidden" || !item) return null;
  return (
    <section
      aria-label={item.label}
      {...phaseProps(
        phase,
        "relative mt-3 rounded-[10px] border border-border bg-card max-md:hidden [@media(hover:hover)_and_(pointer:fine)]:has-[a:hover]:border-input",
      )}
    >
      <AnnouncementLink item={item} className="block px-3 pt-2.5 pb-3">
        <span className="flex items-center gap-1.5 pe-6 text-subtle-foreground text-xs/[18px]">
          <AnnouncementMarker item={item} />
          {item.label}
        </span>
        <span className="mt-0.5 block font-medium text-foreground">
          {item.title}
        </span>
        {item.summary && (
          <span className="mt-0.5 line-clamp-2 block text-[13px]/[19px] text-muted-foreground">
            {item.summary}
          </span>
        )}
      </AnnouncementLink>
      <Button
        size="icon-sm"
        aria-label={`Dismiss ${item.title}`}
        data-sound="tap"
        className="absolute top-1 right-1"
        onClick={() => {
          dismiss();
          document.querySelector<HTMLElement>('a[href="/resources"]')?.focus();
        }}
      >
        <X />
      </Button>
    </section>
  );
}

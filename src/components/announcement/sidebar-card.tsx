"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnnouncementItem } from "@/lib/content/announcement";
import { cn } from "@/lib/utils";
import {
  AnnouncementHeading,
  AnnouncementLink,
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
      aria-label={item.label ?? "Announcement"}
      {...phaseProps(
        phase,
        "relative mt-3 rounded-[10px] border border-border bg-card max-md:hidden [@media(hover:hover)_and_(pointer:fine)]:has-[a:hover]:border-input",
      )}
    >
      <AnnouncementLink
        item={item}
        className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-2 gap-y-0.5 rounded-[9px] px-3 pt-2.5 pb-3 pe-9"
      >
        <AnnouncementHeading
          item={item}
          labelClassName="text-subtle-foreground text-xs/[18px]"
          titleClassName="font-medium text-foreground"
        />
        {item.summary && (
          // An essay's summary is on its page; a promo's is shown whole.
          <span
            className={cn(
              "col-start-2 text-pretty text-[13px]/[19px] text-muted-foreground",
              item.kind === "essay" && "line-clamp-2",
            )}
          >
            {item.summary}
          </span>
        )}
      </AnnouncementLink>
      <Button
        size="icon-sm"
        aria-label={`Dismiss ${item.title}`}
        data-sound="tap"
        className="absolute end-1 top-1 rounded-[5px]"
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

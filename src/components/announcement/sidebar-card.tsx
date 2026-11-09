"use client";

import type { AnnouncementItem } from "@/lib/content/announcement";
import { cn } from "@/lib/utils";
import { AnnouncementBody, phaseProps } from "./announcement-link";
import { useAnnouncement } from "./use-announcement";

/**
 * The announcement on desktop: a card in the sidebar footer, above
 * Resources. Its height comes out of the scrolling list, never the content.
 * It reaches 13px past the column on each side so its icons share the
 * sidebar's: the marker on the logo's and the nav's left edge, the close
 * icon centered over the mute icon.
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
        "relative mt-3 grid grid-cols-[1rem_minmax(0,1fr)_auto] items-start gap-x-2 gap-y-0.5 -mx-[13px] rounded-[10px] border border-border bg-card px-3 pe-5 pt-2.5 pb-3 max-md:hidden has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring [@media(hover:hover)_and_(pointer:fine)]:has-[a:hover]:border-input",
      )}
    >
      <AnnouncementBody
        item={item}
        labelClassName="text-subtle-foreground text-xs/[18px]"
        titleClassName="font-medium text-foreground"
        // An essay's summary is on its page; a promo's is shown whole.
        summaryClassName={cn(
          "text-pretty text-[13px]/[19px] text-muted-foreground",
          item.kind === "essay" && "line-clamp-2",
        )}
        onDismiss={() => {
          dismiss();
          document.querySelector<HTMLElement>('a[href="/resources"]')?.focus();
        }}
      />
    </section>
  );
}

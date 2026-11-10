"use client";

import { useEffect, useRef } from "react";
import type { AnnouncementItem } from "@/lib/content/announcement";
import { cn } from "@/lib/utils";
import { AnnouncementBody, phaseProps } from "./announcement-link";
import { useAnnouncement } from "./use-announcement";

/**
 * The announcement: a card in the sidebar footer, above Resources, at every
 * width (on mobile, inside the sidebar; a dot on the toggle points to it).
 * Its height comes out of the scrolling list, never the content.
 * It reaches 13px past the column on each side so its icons share the
 * sidebar's: the marker on the logo's and the nav's left edge. There is no
 * close button: opening the card marks it read, which is the only way to
 * make it go. Once it is actually on screen it counts as noticed, which
 * clears the toggle dot.
 */
export function SidebarCard({ items }: { items: AnnouncementItem[] }) {
  const { phase, item, open, notice } = useAnnouncement(items);
  const ref = useRef<HTMLElement>(null);

  // On desktop the card is on screen at once; on mobile only when the
  // sidebar is open, since the closed sidebar sits off-canvas.
  useEffect(() => {
    const node = ref.current;
    if (
      phase !== "shown" ||
      !node ||
      typeof IntersectionObserver === "undefined"
    )
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          notice();
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [phase, notice]);

  if (phase === "hidden" || !item) return null;
  return (
    <section
      ref={ref}
      aria-label={item.label ?? "Announcement"}
      {...phaseProps(
        phase,
        "relative mt-3 grid grid-cols-[1rem_minmax(0,1fr)] items-start gap-x-2 gap-y-0.5 -mx-[13px] rounded-[10px] border border-border bg-card px-3 pt-2.5 pb-3 max-md:me-0 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring [@media(hover:hover)_and_(pointer:fine)]:has-[a:hover]:border-input",
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
        onOpen={() => {
          open();
          // A promo opens in a new tab and the card fades out here; move
          // focus on so it isn't lost with the card. An essay navigates.
          if (item.kind === "external") {
            document
              .querySelector<HTMLElement>('a[href="/resources"]')
              ?.focus();
          }
        }}
      />
    </section>
  );
}

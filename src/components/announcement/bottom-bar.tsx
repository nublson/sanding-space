"use client";

import type { AnnouncementItem } from "@/lib/content/announcement";
import { AnnouncementBody, phaseProps } from "./announcement-link";
import { useAnnouncement } from "./use-announcement";

/**
 * The announcement on mobile: a bar floating above the bottom edge, over the
 * essay, so appearing never moves the page. One step lighter than a card so
 * it reads as floating; no shadow. The whole bar is the link. A promo shows
 * its title and description in one row; an essay, "New essay" over its
 * title.
 */
export function BottomBar({ items }: { items: AnnouncementItem[] }) {
  const { phase, item, dismiss } = useAnnouncement(items);
  if (phase === "hidden" || !item) return null;
  return (
    <section
      aria-label={item.label ?? "Announcement"}
      {...phaseProps(
        phase,
        "announcement-bar fixed right-[calc(12px+env(safe-area-inset-right))] bottom-[calc(16px+env(safe-area-inset-bottom))] left-[calc(12px+env(safe-area-inset-left))] z-20 grid min-h-14 grid-cols-[1rem_minmax(0,1fr)_auto] content-center items-start gap-x-2.5 rounded-xl border border-[color-mix(in_oklch,var(--border),var(--foreground)_10%)] bg-[color-mix(in_oklch,var(--card),var(--foreground)_2%)] px-3.5 py-2 md:hidden has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring",
      )}
    >
      <AnnouncementBody
        item={item}
        labelClassName="text-subtle-foreground text-xs/[18px]"
        titleClassName="text-pretty font-medium text-foreground text-sm/[18px]"
        titleLineClassName="text-sm/[18px]"
        // A promo's description runs on after its title, in one row; an
        // essay's summary waits on its page, and "New essay" says why the
        // bar is here.
        summaryInline
        summaryClassName={
          item.kind === "external"
            ? "font-normal text-muted-foreground"
            : undefined
        }
        // The close button centers on the whole bar, across both rows.
        closeClassName="ms-1 row-span-2 row-start-1 h-4 self-center pointer-coarse:after:-inset-3.5"
        onDismiss={() => {
          dismiss();
          document.getElementById("main-content")?.focus();
        }}
      />
    </section>
  );
}

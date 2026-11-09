import { X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { AnnouncementItem } from "@/lib/content/announcement";
import { cn } from "@/lib/utils";
import type { AnnouncementPhase } from "./use-announcement";

/**
 * The announcement's link: an in-site Link for an essay, a new tab for an
 * external promo. Its name is the title it shows, and a new tab is announced
 * by visually hidden text.
 */
export function AnnouncementLink({
  item,
  className,
  children,
}: {
  item: AnnouncementItem;
  className?: string;
  children: ReactNode;
}) {
  if (item.kind === "essay") {
    return (
      <Link href={item.href} data-sound="page" className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener"
      data-sound="page"
      className={className}
    >
      {children} <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/** The "new" marker: the destination's favicon for a promo, else a dot. */
export function AnnouncementMarker({ item }: { item: AnnouncementItem }) {
  if (item.kind === "external" && item.icon) {
    return (
      // biome-ignore lint/performance/noImgElement: a tiny inlined data-URL favicon, like the Resources page's.
      <img
        src={item.icon}
        alt=""
        width={16}
        height={16}
        className="size-4 rounded-[4px] outline outline-1 -outline-offset-1 outline-(--image-outline)"
      />
    );
  }
  return <span aria-hidden className="size-1.5 rounded-full bg-foreground" />;
}

const ROW = ["row-start-1", "row-start-2", "row-start-3"] as const;

/**
 * What the card and the bar share, laid out on their grid of three columns:
 * marker, text, close. The marker and the close icon sit on the same row, so
 * they always share a center: the "New essay" row for an essay's dot, the
 * title's row for a promo's favicon. The title is the link, and its ::after
 * stretches over the whole surface, so pressing anywhere opens it; the close
 * button sits above that layer.
 */
export function AnnouncementBody({
  item,
  onDismiss,
  labelClassName,
  titleClassName,
  summaryClassName,
  closeClassName,
  labelLineClassName = "text-xs/[18px]",
  titleLineClassName,
}: {
  item: AnnouncementItem;
  onDismiss: () => void;
  labelClassName: string;
  titleClassName: string;
  /** Size and leading of the label's line, so an icon can be one line tall. */
  labelLineClassName?: string;
  /** Size and leading of the title's line; omit when the title inherits them. */
  titleLineClassName?: string;
  /** Omit to leave the summary out. */
  summaryClassName?: string;
  closeClassName?: string;
}) {
  const titleRow = item.label ? 1 : 0;
  const onLabel = item.kind === "essay" && Boolean(item.label);
  const markerRow = onLabel ? 0 : titleRow;
  // Each icon is exactly one line of its row's text tall, and the grid
  // aligns to the top, so the icons sit on that row's first line however
  // many lines the title wraps to.
  const line = cn("h-lh", onLabel ? labelLineClassName : titleLineClassName);
  return (
    <>
      <span
        data-slot="marker"
        className={cn(
          "col-start-1 flex items-center justify-center",
          line,
          ROW[markerRow],
        )}
      >
        <AnnouncementMarker item={item} />
      </span>
      {item.label && (
        <span className={cn("col-start-2 row-start-1", labelClassName)}>
          {item.label}
        </span>
      )}
      <AnnouncementLink
        item={item}
        className={cn(
          "col-start-2 after:absolute after:inset-0 focus-visible:outline-none",
          ROW[titleRow],
          titleClassName,
        )}
      >
        {item.title}
      </AnnouncementLink>
      {summaryClassName && item.summary && (
        <span
          className={cn("col-start-2", ROW[titleRow + 1], summaryClassName)}
        >
          {item.summary}
        </span>
      )}
      <Button
        aria-label={`Dismiss ${item.title}`}
        data-sound="tap"
        className={cn(
          // A 16px-wide, one-line-tall icon whose ::after widens the hit
          // area, so the row keeps the height of its text.
          "relative z-10 col-start-3 w-4 rounded-[4px] after:absolute after:-inset-1.5 hover:bg-transparent",
          line,
          ROW[markerRow],
          closeClassName,
        )}
        onClick={onDismiss}
      >
        <X />
      </Button>
    </>
  );
}

/**
 * Shared by the card and the bar: invisible and unreachable until the
 * browser has chosen (pending) and while leaving; faded and lifted in.
 */
export function phaseProps(phase: AnnouncementPhase, className: string) {
  const hidden = phase !== "shown";
  return {
    "data-phase": phase,
    inert: hidden || undefined,
    "aria-hidden": hidden || undefined,
    className: cn(
      // Fade and lift at 300ms in, 200ms out; the press and the hover answer
      // faster. Under reduced motion the lift is dropped here, and the
      // site-wide rule in globals.css cuts every transition to an instant.
      "transition-[opacity,translate,scale,border-color] ease-(--ease-out) has-[a:active]:scale-[0.98]",
      phase === "leaving"
        ? "duration-[200ms,200ms,160ms,150ms]"
        : "duration-[300ms,300ms,160ms,150ms]",
      hidden
        ? "translate-y-2 opacity-0 motion-reduce:translate-y-0"
        : // Mounted already shown, so the fade starts from @starting-style.
          "translate-y-0 opacity-100 starting:translate-y-2 starting:opacity-0 motion-reduce:starting:translate-y-0",
      className,
    ),
  };
}

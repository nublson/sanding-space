import Link from "next/link";
import type { ReactNode } from "react";
import type { AnnouncementItem } from "@/lib/content/announcement";
import { cn } from "@/lib/utils";
import type { AnnouncementPhase } from "./use-announcement";

/**
 * The announcement's link: an in-site Link for an essay, a new tab for an
 * external promo (and the accessible name says so).
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
  const name = item.label ? `${item.label}: ${item.title}` : item.title;
  if (item.kind === "essay") {
    return (
      <Link
        href={item.href}
        data-sound="page"
        aria-label={name}
        className={className}
      >
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
      aria-label={`${name} (opens in a new tab)`}
      className={className}
    >
      {children}
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
        className="size-4 rounded-[4px]"
      />
    );
  }
  return <span aria-hidden className="size-1.5 rounded-full bg-foreground" />;
}

/**
 * The label and title in one text column beside a 1rem marker column. The
 * marker sits on the line it belongs to: an essay's dot on the "New essay"
 * line, a promo's favicon on the title's line. Each marker cell is one line
 * of its neighbour's text tall (h-lh), so the two share a center.
 */
export function AnnouncementHeading({
  item,
  labelClassName,
  titleClassName,
}: {
  item: AnnouncementItem;
  labelClassName: string;
  titleClassName: string;
}) {
  const onLabel = item.kind === "essay" && item.label;
  const marker = (lineClass: string) => (
    <span
      data-slot="marker"
      className={cn("flex h-lh items-center justify-center", lineClass)}
    >
      <AnnouncementMarker item={item} />
    </span>
  );
  return (
    <>
      {item.label && onLabel && marker(labelClassName)}
      {item.label && (
        <span className={cn("col-start-2", labelClassName)}>{item.label}</span>
      )}
      {!onLabel && marker(titleClassName)}
      <span className={cn("col-start-2", titleClassName)}>{item.title}</span>
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
      // faster. Reduced motion keeps the fade and drops only the lift.
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

import Link from "next/link";
import type { ReactNode } from "react";
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
  onClick,
  children,
}: {
  item: AnnouncementItem;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  if (item.kind === "essay") {
    return (
      <Link
        href={item.href}
        data-sound="page"
        // Like the other sidebar links: on mobile the shell closes the
        // sidebar and this route transition slides the content back.
        transitionTypes={["sidebar-nav"]}
        className={className}
        onClick={onClick}
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
      className={className}
      onClick={onClick}
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

/*
 * On its first paint the text arrives in reading order, 40ms apart: label,
 * title, summary. Opacity and a 4px lift only, from @starting-style, so it
 * never replays on re-renders or navigation.
 */
const RISE =
  "transition-[opacity,translate] duration-250 ease-(--ease-out) starting:translate-y-1 starting:opacity-0 motion-reduce:starting:translate-y-0";

/**
 * The card's content on its two-column grid: marker, then one text column.
 * An essay's dot sits on its "New essay" line; a promo's favicon on the
 * title's first line. Each marker cell is one line of its neighbour's text
 * tall (h-lh), so the two share a center. The title is the link, and its
 * ::after stretches over the whole card, so pressing anywhere opens it.
 * Opening it is the only way to make the card go away.
 */
export function AnnouncementBody({
  item,
  onOpen,
  labelClassName,
  titleClassName,
  summaryClassName,
  labelLineClassName = "text-xs/[18px]",
}: {
  item: AnnouncementItem;
  onOpen: () => void;
  labelClassName: string;
  titleClassName: string;
  summaryClassName: string;
  /** Size and leading of the label's line, so the dot can be one line tall. */
  labelLineClassName?: string;
}) {
  // Only essays carry a label ("New essay").
  const titleRow = item.label ? 1 : 0;
  return (
    <>
      <span
        data-slot="marker"
        className={cn(
          "col-start-1 flex h-lh items-center justify-center",
          item.label && labelLineClassName,
          ROW[item.label ? 0 : titleRow],
        )}
      >
        <AnnouncementMarker item={item} />
      </span>
      {item.label && (
        <span
          className={cn(
            "col-start-2 row-start-1",
            RISE,
            "delay-0",
            labelClassName,
          )}
        >
          {item.label}
        </span>
      )}
      <AnnouncementLink
        item={item}
        onClick={onOpen}
        className={cn(
          "col-start-2 after:absolute after:inset-0 focus-visible:outline-none",
          RISE,
          "delay-[40ms]",
          ROW[titleRow],
          titleClassName,
        )}
      >
        {item.title}
      </AnnouncementLink>
      {item.summary && (
        <span
          className={cn(
            "col-start-2",
            RISE,
            "delay-[80ms]",
            ROW[titleRow + 1],
            summaryClassName,
          )}
        >
          {item.summary}
        </span>
      )}
    </>
  );
}

/**
 * The card's phases: invisible and unreachable until the
 * browser has chosen (pending) and while leaving; faded and lifted in.
 */
export function phaseProps(phase: AnnouncementPhase, className: string) {
  const hidden = phase !== "shown";
  return {
    "data-phase": phase,
    inert: hidden || undefined,
    "aria-hidden": hidden || undefined,
    className: cn(
      // Fade and lift at 250ms in, 200ms out; the press and the hover answer
      // faster. Under reduced motion the lift and the press are dropped, and
      // only the fade and the border color play.
      "transition-[opacity,translate,scale,border-color] ease-(--ease-out) has-[a:active]:scale-[0.98] motion-reduce:has-[a:active]:scale-100",
      phase === "leaving"
        ? "duration-[200ms,200ms,160ms,150ms]"
        : "duration-[250ms,250ms,160ms,150ms]",
      hidden
        ? "translate-y-2 opacity-0 motion-reduce:translate-y-0"
        : // Mounted already shown, so the fade starts from @starting-style.
          "translate-y-0 opacity-100 starting:translate-y-2 starting:opacity-0 motion-reduce:starting:translate-y-0",
      className,
    ),
  };
}

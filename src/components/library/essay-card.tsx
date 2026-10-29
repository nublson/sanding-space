import Link from "next/link";
import {
  type SkeletonLineSpec,
  SkeletonLines,
} from "@/components/skeleton-line";
import { DemoStage } from "@/components/stage/demo-stage";
import { LiveThumbnail } from "@/components/stage/live-thumbnail";
import type { Essay } from "@/lib/content/types";

export type TitleLevel = 2 | 3 | 4;

const textBlock = (soon: boolean, essay: Essay, level: TitleLevel) => {
  const Title = `h${level}` as const;
  return (
    <div className="mt-2.5 px-0.5">
      <Title
        className={`text-base font-medium max-md:text-sm ${soon ? "text-subtle-foreground" : "text-foreground"}`}
      >
        {essay.title}
        {/* Sighted readers get the muted text and the empty stage; this
            keeps the status for screen readers. */}
        {soon && <span className="sr-only">{" (coming soon)"}</span>}
      </Title>
      {essay.summary && (
        <p className="mt-0.5 text-sm/[22px] text-subtle-foreground max-md:text-[13px]/5">
          {essay.summary}
        </p>
      )}
    </div>
  );
};

// Line counts of a typical card at each size (measured on the live sections):
// the hero's title fits one line and its summary wraps on a phone; a grid
// card is narrow, so its title takes two lines and its summary three or four.
const CARD_LINES: Record<
  "card" | "hero",
  { title: SkeletonLineSpec[]; summary: SkeletonLineSpec[] }
> = {
  hero: {
    title: [{ width: "40%" }],
    summary: [{ width: "100%", mobile: true }, { width: "62%" }],
  },
  card: {
    title: [{ width: "92%" }, { width: "48%" }],
    summary: [
      { width: "100%" },
      { width: "94%" },
      { width: "97%", mobile: true },
      { width: "58%" },
    ],
  },
};

/**
 * The card while its data streams in: the same stage and text box, with as
 * many lines as the text usually takes, so the card lands without moving.
 */
export function EssayCardSkeleton({ size }: { size: "card" | "hero" }) {
  const lines = CARD_LINES[size];
  return (
    <div>
      <DemoStage size={size} />
      <div className="mt-2.5 px-0.5">
        <SkeletonLines lines={lines.title} lineClassName="h-6 max-md:h-5" />
        <SkeletonLines
          lines={lines.summary}
          lineClassName="h-[22px] max-md:h-5"
          className="mt-0.5"
        />
      </div>
    </div>
  );
}

export function EssayCard({
  essay,
  size = "card",
  titleLevel = 3,
}: {
  essay: Essay;
  size?: "card" | "hero";
  /** One level below the heading the card sits under. */
  titleLevel?: TitleLevel;
}) {
  if (essay.status === "Soon") {
    return (
      <div className="cursor-default">
        <DemoStage size={size} />
        {textBlock(true, essay, titleLevel)}
      </div>
    );
  }
  return (
    <Link
      href={`/${essay.slug}`}
      data-sound="page"
      className="group press -m-2 block rounded-[18px] p-2 pointer-fine:hover:bg-card"
    >
      <LiveThumbnail
        demo={essay.coverDemo}
        essaySlug={essay.slug}
        size={size}
        preview
      />
      {textBlock(false, essay, titleLevel)}
    </Link>
  );
}

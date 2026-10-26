import Link from "next/link";
import { DemoStage } from "@/components/stage/demo-stage";
import { LiveThumbnail } from "@/components/stage/live-thumbnail";
import type { Essay } from "@/lib/content/types";

export type TitleLevel = 2 | 3 | 4;

const textBlock = (soon: boolean, essay: Essay, level: TitleLevel) => {
  const Title = `h${level}` as const;
  return (
    <div className="mt-2.5 px-0.5">
      {/* Inline, so the badge always follows the title's last word. */}
      <div>
        <Title
          className={`inline text-sm font-medium ${soon ? "text-subtle-foreground" : "text-foreground"}`}
        >
          {essay.title}
        </Title>
        {soon && (
          <span className="ml-2 inline-block rounded-md border border-border px-1.5 align-baseline text-[11px] leading-4 text-subtle-foreground">
            Soon
          </span>
        )}
      </div>
      {essay.summary && (
        <p className="mt-0.5 text-[13px] leading-5 text-subtle-foreground">
          {essay.summary}
        </p>
      )}
    </div>
  );
};

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
      className="press -m-2 block rounded-[18px] p-2 pointer-fine:hover:bg-card"
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

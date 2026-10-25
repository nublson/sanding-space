import Link from "next/link";
import { DemoStage } from "@/components/stage/demo-stage";
import { LiveThumbnail } from "@/components/stage/live-thumbnail";
import type { Essay } from "@/lib/content/types";

const textBlock = (soon: boolean, essay: Essay) => (
  <div className="mt-2.5 px-0.5">
    <div className="flex items-center gap-2">
      <h3
        className={`text-sm font-medium ${soon ? "text-subtle-foreground" : "text-foreground"}`}
      >
        {essay.title}
      </h3>
      {soon && (
        <span className="rounded-md border border-border px-1.5 text-[11px] leading-4 text-subtle-foreground">
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

export function EssayCard({ essay }: { essay: Essay }) {
  if (essay.status === "Soon") {
    return (
      <div className="cursor-default">
        <DemoStage size="card" />
        {textBlock(true, essay)}
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
        size="card"
      />
      {textBlock(false, essay)}
    </Link>
  );
}

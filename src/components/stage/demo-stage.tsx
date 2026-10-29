import type { ReactNode } from "react";
import { resolveDemo } from "@/lib/demo-meta";
import { cn } from "@/lib/utils";

/** An essay stage with no registered demo to size it (the skeleton, an empty cover). */
export const ESSAY_STAGE_HEIGHT = 420;

/**
 * The essay stage's height for a demo: its registry height, the size a fresh
 * embed opens at, so the demo is the same size in an essay and in an embed.
 */
export function essayStageHeight(demo: string | null): number {
  if (!demo) return ESSAY_STAGE_HEIGHT;
  const resolved = resolveDemo(demo);
  const target =
    resolved.kind === "alias" ? resolveDemo(resolved.target) : resolved;
  return target.kind === "demo" ? target.entry.height : ESSAY_STAGE_HEIGHT;
}

export function DemoStage({
  size,
  height = ESSAY_STAGE_HEIGHT,
  preview = false,
  children,
}: {
  /** `essay` is at least `height` tall; cards keep an aspect ratio, `hero` 2:1, `card` 4:3. */
  size: "essay" | "hero" | "card";
  /** The essay stage's height in px, from `essayStageHeight`. */
  height?: number;
  /** A non-interactive preview (inside a link): live, but not focusable or pressable. */
  preview?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      inert={preview || undefined}
      aria-hidden={preview ? "true" : undefined}
      // A live demo owns its gestures: no sidebar swipe starts here.
      data-swipe-ignore={preview ? undefined : ""}
      // A floor, not a fixed size: content taller than the registry height
      // (a demo that stacks on a phone) grows the stage, as it grows an embed.
      style={size === "essay" ? { minHeight: `${height}px` } : undefined}
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden rounded-[10px] border border-border bg-card",
        size === "hero" && "aspect-[2/1]",
        size === "card" && "aspect-[4/3]",
      )}
    >
      {children}
    </div>
  );
}

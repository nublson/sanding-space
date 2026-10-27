import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DemoStage({
  size,
  preview = false,
  children,
}: {
  size: "hero" | "card";
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
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden rounded-[10px] border border-border bg-card",
        size === "hero" ? "aspect-[2/1]" : "aspect-[4/3]",
      )}
    >
      {children}
    </div>
  );
}

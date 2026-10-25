import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DemoStage({
  size,
  children,
}: {
  size: "hero" | "card";
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden rounded-[10px] border border-border bg-card",
        size === "hero" ? "aspect-[2/1]" : "aspect-[4/3]",
      )}
    >
      {children}
    </div>
  );
}

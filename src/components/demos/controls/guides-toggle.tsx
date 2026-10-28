"use client";

import { Toggle } from "@base-ui/react/toggle";
import { Crosshair } from "lucide-react";
import { playSound } from "@/lib/sounds";

/** The dashed "Guides" chip. What the guides show is up to each demo. */
export function GuidesToggle({
  pressed,
  onChange,
}: {
  pressed: boolean;
  onChange: (pressed: boolean) => void;
}) {
  return (
    <Toggle
      pressed={pressed}
      onPressedChange={(next) => {
        playSound(next ? "toggle-on" : "toggle-off");
        onChange(next);
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-border border-dashed px-3.5 py-1.5 pointer-coarse:min-h-11 text-muted-foreground text-sm outline-none transition-colors duration-150 ease-(--ease-out) hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-pressed:border-foreground/40 data-pressed:bg-foreground/7 data-pressed:text-foreground"
    >
      <Crosshair aria-hidden className="size-4" />
      Guides
    </Toggle>
  );
}

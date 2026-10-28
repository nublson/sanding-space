"use client";

import { Crosshair } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
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
    >
      <Crosshair aria-hidden />
      Guides
    </Toggle>
  );
}

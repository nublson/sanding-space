"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import { playSound } from "@/lib/sounds";

type Option<T extends string> = { value: T; label: string };

/** Two options, one always on; the pill slides to the active one. */
export function SegmentedSwitch<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly [Option<T>, Option<T>];
  value: T;
  onChange: (value: T) => void;
}) {
  const pillId = useId();
  const reduced = useReducedMotion();

  return (
    <ToggleGroup
      aria-label={label}
      value={[value]}
      onValueChange={(next) => {
        // Pressing the active option un-presses it; a switch always keeps one.
        const picked = next[0] as T | undefined;
        if (picked === undefined || picked === value) return;
        playSound("tap");
        onChange(picked);
      }}
      className="flex gap-0.5"
    >
      {options.map((option) => (
        <Toggle
          key={option.value}
          value={option.value}
          className="relative rounded-full px-4 py-2 text-muted-foreground text-sm outline-none transition-colors duration-150 ease-(--ease-out) hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-pressed:text-foreground"
        >
          {option.value === value ? (
            <motion.span
              layoutId={pillId}
              aria-hidden
              className="absolute inset-0 rounded-full bg-foreground/7"
              transition={
                reduced
                  ? { duration: 0 }
                  : { type: "spring", duration: 0.3, bounce: 0 }
              }
            />
          ) : null}
          <span className="relative">{option.label}</span>
        </Toggle>
      ))}
    </ToggleGroup>
  );
}

"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import { playSound } from "@/lib/sounds";

type Option<T extends string> = { value: T; label: string };

/**
 * Two options, one always on; the pill slides to the active one. A radio
 * group, so Tab lands on the active option and arrow keys change it.
 */
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
    <RadioGroup
      aria-label={label}
      value={value}
      onValueChange={(next) => {
        if (next === value) return;
        playSound("tap");
        onChange(next as T);
      }}
      className="flex gap-0.5"
    >
      {options.map((option) => (
        <Radio.Root
          key={option.value}
          value={option.value}
          className="relative inline-flex cursor-pointer items-center rounded-full px-4 py-2 pointer-coarse:min-h-11 text-muted-foreground text-sm outline-none transition-colors duration-150 ease-(--ease-out) hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:text-foreground"
        >
          {option.value === value ? (
            // Under reduced motion the pill fades in place instead of sliding.
            <motion.span
              layoutId={reduced ? undefined : pillId}
              initial={reduced ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              aria-hidden
              className="absolute inset-0 rounded-full bg-foreground/7"
              transition={
                reduced
                  ? { duration: 0.15, ease: "easeOut" }
                  : { type: "spring", duration: 0.3, bounce: 0 }
              }
            />
          ) : null}
          <span className="relative">{option.label}</span>
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}

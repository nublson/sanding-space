"use client";

import { motion, useReducedMotion } from "motion/react";
import type { DemoProps } from "notionic";
import { readNumber } from "@/lib/params";

export default function ButtonPressScale({ params }: DemoProps) {
  const reduced = useReducedMotion();
  const stiffness = readNumber(params, "stiffness", 400, {
    min: 50,
    max: 1000,
  });
  const damping = readNumber(params, "damping", 30, { min: 5, max: 100 });
  const scale = readNumber(params, "scale", 0.96, { min: 0.5, max: 1 });

  return (
    <div className="flex h-full w-full items-center justify-center">
      <motion.button
        type="button"
        className="cursor-pointer rounded-full bg-foreground px-[18px] py-2 font-sans text-[13px] font-medium text-background"
        whileTap={reduced ? undefined : { scale }}
        transition={{ type: "spring", stiffness, damping }}
      >
        Press and hold
      </motion.button>
    </div>
  );
}

"use client";

import { type ReactNode, useState } from "react";
import { readChoice } from "@/lib/params";
import { GuidesToggle } from "./guides-toggle";
import { showsControls } from "./presets";

/**
 * The `guides` preset: `?guides=on|off` shows the Guides chip and sets where
 * it starts. Without the param there is no chip and guides stay off; with
 * `controls=off` guides keep their state but the chip is hidden.
 */
export function useGuides(params: Record<string, string>): {
  guides: boolean;
  control: ReactNode | null;
} {
  const initial = readChoice(params, "guides", ["off", "on"], "off");
  const [guides, setGuides] = useState(initial === "on");
  if (initial === undefined) return { guides: false, control: null };
  if (!showsControls(params)) return { guides, control: null };
  return {
    guides,
    control: <GuidesToggle pressed={guides} onChange={setGuides} />,
  };
}

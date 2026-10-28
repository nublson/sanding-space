"use client";

import { type ReactNode, useState } from "react";
import { readChoice } from "@/lib/params";
import { GuidesToggle } from "./guides-toggle";
import { showsControls } from "./presets";

/**
 * The `guides` preset: `?guides=on|off` sets whether guides draw. The chip
 * shows only with `controls=on`; without the guides param guides stay off.
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

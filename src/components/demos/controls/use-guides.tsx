"use client";

import { type ReactNode, useState } from "react";
import { readChoice } from "@/lib/params";
import { GuidesToggle } from "./guides-toggle";

/**
 * The `guides` preset: `?guides=on|off` shows the Guides chip and sets where
 * it starts. Without the param there is no chip and guides stay off.
 */
export function useGuides(params: Record<string, string>): {
  guides: boolean;
  control: ReactNode | null;
} {
  const initial = readChoice(params, "guides", ["off", "on"], "off");
  const [guides, setGuides] = useState(initial === "on");
  if (initial === undefined) return { guides: false, control: null };
  return {
    guides,
    control: <GuidesToggle pressed={guides} onChange={setGuides} />,
  };
}

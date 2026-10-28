import { readChoice } from "@/lib/params";

/**
 * The `controls` preset: `?controls=on` shows the controls the other params
 * ask for, starting at the states they set; `?controls=off` hides them, so
 * `?pressure=on&controls=off` embeds that state locked. Without the param (or
 * with an unknown value) a demo falls back to `byDefault`: hidden unless the
 * demo's controls are its subject.
 */
export function showsControls(
  params: Record<string, string>,
  byDefault: "on" | "off" = "off",
): boolean {
  return (
    (readChoice(params, "controls", ["on", "off"], byDefault) ?? byDefault) ===
    "on"
  );
}

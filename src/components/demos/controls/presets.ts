import { readChoice } from "@/lib/params";

/**
 * The `controls` preset: controls are hidden by default, so `?pressure=on`
 * embeds that state locked. `?controls=on` shows the controls the other
 * params ask for, starting at the states they set.
 */
export function showsControls(params: Record<string, string>): boolean {
  return readChoice(params, "controls", ["on", "off"], "off") === "on";
}

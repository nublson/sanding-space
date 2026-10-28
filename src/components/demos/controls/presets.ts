import { readChoice } from "@/lib/params";

/**
 * The `controls` preset: `?controls=off` hides every control a demo would
 * show, keeping the states the other params set. An embed can then lock a
 * state, as in `?pressure=on&controls=off`.
 */
export function showsControls(params: Record<string, string>): boolean {
  return readChoice(params, "controls", ["on", "off"], "on") !== "off";
}

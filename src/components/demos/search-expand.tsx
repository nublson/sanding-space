"use client";

import { Search as SearchIcon, X } from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import type { DemoProps } from "notionic";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { readChoice } from "@/lib/params";
import { playSound } from "@/lib/sounds";
import { DemoLayout } from "./controls/demo-layout";
import { showsControls } from "./controls/presets";
import { SegmentedSwitch } from "./controls/segmented-switch";

type Mode = "over" | "refined";

const MODE_OPTIONS = [
  { value: "over", label: "Over-animated" },
  { value: "refined", label: "Refined" },
] as const;

// Both fields grow 1.75x on focus; only the spring differs. Over-animated is
// underdamped (ratio ~0.4): it overshoots by a quarter and rings once.
// Refined is near critical (ratio ~0.8): about 1% overshoot, settled in ~170ms.
const SPRINGS = {
  over: { type: "spring", stiffness: 820, damping: 23, mass: 1 },
  refined: { type: "spring", stiffness: 950, damping: 49, mass: 1 },
} as const;

export default function SearchExpand({ params }: DemoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const refined = readChoice(params, "refined", ["off", "on"], "off");
  const [mode, setMode] = useState<Mode>(refined === "on" ? "refined" : "over");
  // A field with text stays open, so the query is never cut off.
  const open = focused || query !== "";

  function clear() {
    setQuery("");
    // The clear button unmounts under the pointer; keep the caret in the field.
    inputRef.current?.focus();
  }

  return (
    // Layout animations are transforms: under reduced motion they snap.
    <MotionConfig reducedMotion="user">
      <div data-stream className="flex w-full self-stretch">
        <DemoLayout
          bottom={
            // The switch is the demo, so it shows unless controls=off.
            !showsControls(params, "on") ? null : (
              <SegmentedSwitch
                label="Animation"
                options={MODE_OPTIONS}
                value={mode}
                onChange={setMode}
              />
            )
          }
        >
          <div className="flex h-full items-center justify-center px-6">
            <search className="contents">
              {/* The width change animates as a scale. In Refined, the contents
                  sit in a position-only layout layer that Motion counter-scales,
                  so they never stretch; the pill clips them while it grows.
                  Over-animated leaves them in the scale on purpose. Motion
                  corrects only the pill's own corner radius, set in style for
                  that reason. */}
              <motion.div
                layout
                transition={SPRINGS[mode]}
                style={{ borderRadius: 21 }}
                className={`relative h-10.5 overflow-hidden border border-foreground/10 bg-foreground/3 transition-colors duration-150 ease-(--ease-out) focus-within:border-foreground/25 ${open ? "w-[283px]" : "w-[162px]"}`}
              >
                <motion.div
                  // Remount on mode change: once a node has joined layout
                  // projection, layout={false} doesn't take it out again.
                  key={mode}
                  layout={mode === "refined" ? "position" : false}
                  transition={SPRINGS[mode]}
                  className="absolute inset-0"
                >
                  <SearchIcon
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    ref={inputRef}
                    type="search"
                    aria-label="Search"
                    placeholder="Search…"
                    autoComplete="off"
                    spellCheck={false}
                    value={query}
                    onValueChange={setQuery}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={(e) => {
                      // Not every browser clears a search field on Escape; once
                      // empty, Escape is left to the page.
                      if (e.key === "Escape" && query) {
                        e.preventDefault();
                        setQuery("");
                      }
                    }}
                    // The pill draws the border and the focus state; the input
                    // inside is bare.
                    className="h-full rounded-none border-0 bg-transparent pr-10 pl-10 text-base hover:border-0 focus-visible:ring-0"
                  />
                  {query ? (
                    <Button
                      size="icon-sm"
                      aria-label="Clear search"
                      onClick={() => {
                        playSound("tap");
                        clear();
                      }}
                      className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full pointer-coarse:size-11 starting:scale-90 starting:opacity-0"
                    >
                      <X aria-hidden />
                    </Button>
                  ) : null}
                </motion.div>
              </motion.div>
            </search>
          </div>
        </DemoLayout>
      </div>
    </MotionConfig>
  );
}

"use client";

import { AudioLines, Bookmark, Check, Plus, Rotate3d } from "lucide-react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import type { DemoProps } from "notionic";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { DemoLayout } from "./controls/demo-layout";
import { playSand } from "./sand-sound";

/** The four things to sand, each its own chip under the card. */
const FIXES = [
  { key: "label", name: "Label" },
  { key: "ring", name: "Focus ring" },
  { key: "target", name: "44px target" },
  { key: "pressed", name: "Pressed state" },
] as const;
type Fix = (typeof FIXES)[number];
type Sanded = Record<Fix["key"], boolean>;
const ROUGH: Sanded = {
  label: false,
  ring: false,
  target: false,
  pressed: false,
};

const SPRING = { type: "spring", stiffness: 260, damping: 28 } as const;
/** The site's --ease-out, for Motion. */
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const ICON_SWAP =
  "transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-opacity";
const ICON_HIDDEN =
  "scale-25 opacity-0 blur-[4px] motion-reduce:scale-100 motion-reduce:blur-none";

/**
 * A chip's icon: a plus while rough, a check once sanded. Both share one
 * slot, so the chip keeps its width; under reduced motion they only fade.
 */
function ChipIcon({ on }: { on: boolean }) {
  return (
    <span aria-hidden className="grid shrink-0 *:col-start-1 *:row-start-1">
      <Plus className={cn(ICON_SWAP, on && ICON_HIDDEN)} />
      <Check className={cn(ICON_SWAP, !on && ICON_HIDDEN)} />
    </span>
  );
}

/**
 * The card's one control. It looks the same at every stage; each point
 * sanded on the back changes only what a keyboard or screen reader meets.
 */
function SaveButton({
  sanded,
  saved,
  onToggle,
}: {
  sanded: Sanded;
  saved: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      size="icon-sm"
      aria-label={sanded.label ? "Save" : undefined}
      aria-pressed={sanded.pressed ? saved : undefined}
      onClick={onToggle}
      className={cn(
        "relative size-6",
        saved && "text-foreground",
        !sanded.ring && "focus-visible:ring-0",
        // 24px drawn, 44px to hit.
        sanded.target && "before:absolute before:-inset-2.5",
      )}
    >
      <Bookmark aria-hidden className={cn(saved && "fill-current")} />
    </Button>
  );
}

/**
 * The button as a keyboard and screen reader user meets it. `last` is the
 * most recent press, so its new words glow; `version` re-keys the
 * transcript on every press.
 */
function Back({
  sanded,
  saved,
  last,
  version,
}: {
  sanded: Sanded;
  saved: boolean;
  last: Fix["key"] | null;
  version: number;
}) {
  const reduced = useReducedMotion();
  // Each word tagged with the fix that adds it, so the new ones can glow.
  const words: { id: string; text: string; by: Fix["key"] | null }[] = [
    ...(sanded.label
      ? [{ id: "name", text: "Save, ", by: "label" as const }]
      : []),
    ...(sanded.pressed
      ? [{ id: "toggle", text: "toggle ", by: "pressed" as const }]
      : []),
    { id: "role", text: "button", by: null },
    ...(sanded.pressed
      ? [
          {
            id: "state",
            text: saved ? ", pressed" : ", not pressed",
            by: "pressed" as const,
          },
        ]
      : []),
  ];
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <p className="flex items-start gap-2 rounded-[9px] bg-foreground/6 px-3 py-2.5 font-mono text-xs/5">
        <AudioLines
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground"
        />
        <motion.span
          key={version}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
        >
          <span className="sr-only">A screen reader says: </span>“
          {words.map((word) => (
            <span
              key={word.id}
              className={cn(
                word.by !== null &&
                  word.by === last &&
                  "box-decoration-clone rounded-[2px] transition-colors delay-200 duration-600 ease-(--ease-out) starting:bg-foreground/12",
              )}
            >
              {word.text}
            </span>
          ))}
          ”
        </motion.span>
      </p>
      <div
        aria-hidden
        className="flex flex-1 items-center justify-center gap-3"
      >
        <div className="relative flex size-11 items-center justify-center">
          {/* The hit area, outlined at its real size. */}
          <div
            className="absolute inset-0 rounded-lg border border-foreground/50 border-dashed motion-safe:transition-transform motion-safe:duration-300 ease-(--ease-out)"
            style={{ scale: sanded.target ? 1 : 24 / 44 }}
          />
          <div
            className={cn(
              "absolute size-7 rounded-[9px] ring-2 ring-foreground transition-opacity duration-300 ease-(--ease-out)",
              !sanded.ring && "opacity-0",
            )}
          />
          <Bookmark className={cn("size-4", saved && "fill-current")} />
        </div>
        <span className="w-8 font-mono text-muted-foreground text-xs">
          {sanded.target ? "44px" : "24px"}
        </span>
      </div>
    </div>
  );
}

/**
 * A card with a bookmark button. The button above it turns it over on a spring.
 * The back shows the button as a keyboard and screen reader user meets it.
 * Below, one chip per thing to sand: label, focus ring, 44px hit area,
 * pressed state; pressing one again roughs it back up. Each changes the
 * real button on the front too, though the front never looks different.
 * Under reduced motion it crossfades the sides instead.
 */
export default function SandedButton(_: DemoProps) {
  const reduced = useReducedMotion();
  const rotate = useMotionValue(0);
  /** The settled angle: a multiple of 180, odd on the back. */
  const angle = useRef(0);
  const [back, setBack] = useState(false);
  const [sanded, setSanded] = useState<Sanded>(ROUGH);
  // The latest points, so presses quicker than a render all count.
  const sandedRef = useRef(sanded);
  const [last, setLast] = useState<{ fix: Fix["key"] | null; version: number }>(
    { fix: null, version: 0 },
  );
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");

  function turn() {
    playSound("page");
    setBack(!back);
    setMessage(back ? "The front." : "The back.");
    if (reduced) return;
    // Always the same way round, retargeting from wherever a turn has got to.
    angle.current -= 180;
    animate(rotate, angle.current, SPRING);
  }

  function sand(fix: Fix) {
    const next = {
      ...sandedRef.current,
      [fix.key]: !sandedRef.current[fix.key],
    };
    sandedRef.current = next;
    setSanded(next);
    setLast(({ version }) => ({
      fix: next[fix.key] ? fix.key : null,
      version: version + 1,
    }));
    if (next[fix.key]) playSand();
    else playSound("toggle-off");
    setMessage(`${fix.name} ${next[fix.key] ? "sanded" : "rough again"}.`);
  }

  const face =
    "absolute inset-0 rounded-[25px] border border-border bg-foreground/4";

  return (
    <div data-stream className="flex w-full self-stretch">
      <DemoLayout
        top={
          <Button size="text" onClick={turn}>
            <Rotate3d aria-hidden />
            {/* Both labels share one slot, so the button keeps its width. */}
            <span className="grid *:col-start-1 *:row-start-1">
              <span aria-hidden={back} className={cn(back && "invisible")}>
                Show back
              </span>
              <span aria-hidden={!back} className={cn(!back && "invisible")}>
                Show front
              </span>
            </span>
          </Button>
        }
        bottom={
          // One chip per point to sand; each works from either side. A fixed
          // two-by-two grid, so turning a chip on never reflows the others.
          <fieldset aria-label="Sand" className="grid grid-cols-2 gap-2">
            {FIXES.map((fix) => (
              <Toggle
                key={fix.key}
                pressed={sanded[fix.key]}
                onPressedChange={() => sand(fix)}
                className="justify-start"
              >
                <ChipIcon on={sanded[fix.key]} />
                {fix.name}
              </Toggle>
            ))}
          </fieldset>
        }
      >
        <div className="flex h-full items-center justify-center px-4 perspective-[900px]">
          <motion.div
            style={reduced ? undefined : { rotateY: rotate }}
            className={cn("relative h-72 w-56", !reduced && "transform-3d")}
          >
            <div
              inert={back}
              className={cn(
                face,
                "flex flex-col gap-3 p-3",
                reduced
                  ? "transition-opacity duration-200 ease-(--ease-out)"
                  : "backface-hidden",
                reduced && back && "opacity-0",
              )}
            >
              <div
                aria-hidden
                className="flex-1 rounded-[13px] bg-foreground/6"
              />
              <div className="flex items-end justify-between gap-2 px-1 pb-1">
                <div className="min-w-0">
                  <p className="font-medium text-sm">Field notes</p>
                  <p className="text-muted-foreground text-xs">6 min read</p>
                </div>
                <SaveButton
                  sanded={sanded}
                  saved={saved}
                  onToggle={() => {
                    playSound(saved ? "toggle-off" : "toggle-on");
                    setSaved(!saved);
                  }}
                />
              </div>
            </div>
            <div
              inert={!back}
              className={cn(
                face,
                reduced
                  ? "transition-opacity duration-200 ease-(--ease-out)"
                  : "backface-hidden rotate-y-180",
                reduced && !back && "opacity-0",
              )}
            >
              <Back
                sanded={sanded}
                saved={saved}
                last={last.fix}
                version={last.version}
              />
            </div>
          </motion.div>
        </div>
      </DemoLayout>
      <output aria-live="polite" className="sr-only">
        {message}
      </output>
    </div>
  );
}

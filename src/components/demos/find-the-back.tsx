"use client";

import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Check,
  ClipboardPaste,
  LoaderCircle,
  type LucideIcon,
  MouseOff,
  ServerCrash,
  Snail,
} from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import type { DemoProps } from "notionic";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import { readChoice } from "@/lib/params";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { DemoLayout } from "./controls/demo-layout";
import { showsControls } from "./controls/presets";
import { playSand } from "./sand-sound";

type Habit = "mouse" | "reader" | "slow" | "paste" | "back" | "fail";
type Flags = Record<Habit, boolean>;
type Status = "idle" | "sending" | "subscribed" | "invalid" | "failed";

/**
 * The six habits, each with the one rough edge it exposes and the `task` that
 * runs into it. An `action` habit (Paste, Go back) happens once per press
 * instead of staying on.
 */
const HABITS: {
  key: Habit;
  name: string;
  icon: LucideIcon;
  edge: string;
  task: string;
  action?: boolean;
}[] = [
  {
    key: "mouse",
    name: "No mouse",
    icon: MouseOff,
    edge: "Tab skips the button, and Enter does nothing.",
    task: "Sign up with only Tab and Enter.",
  },
  {
    key: "reader",
    name: "Screen reader",
    icon: AudioLines,
    edge: "The arrow button has no name: it's just “button”.",
    task: "Listen to what a screen reader hears.",
  },
  {
    key: "slow",
    name: "Slow network",
    icon: Snail,
    edge: "No sign it was sending, and every click sent again.",
    task: "Sign up, then click again while it waits.",
  },
  {
    key: "paste",
    name: "Paste",
    icon: ClipboardPaste,
    edge: "Stray spaces from the paste made it “invalid”.",
    task: "Sign up with the pasted address.",
    action: true,
  },
  {
    key: "back",
    name: "Go back",
    icon: ArrowLeft,
    edge: "Coming back threw away what you typed.",
    task: "Type an address, then press Go back.",
    action: true,
  },
  {
    key: "fail",
    name: "Make it fail",
    icon: ServerCrash,
    edge: "The error said nothing, and wiped the address.",
    task: "Sign up, and see what the error leaves you.",
  },
];
const KEYS = HABITS.map((habit) => habit.key);
const NONE: Flags = {
  mouse: false,
  reader: false,
  slow: false,
  paste: false,
  back: false,
  fail: false,
};

/**
 * Rows slide aside as a found edge or the transcript adds a line, rather than
 * jumping. Motion only, so `reducedMotion="user"` turns it into a snap.
 */
const SLIDE = { type: "spring", duration: 0.3, bounce: 0 } as const;

/**
 * A habit's row: its toggle (or action) stretched to a list item. The card's
 * tint hides `border-border`, so the dashed edge uses the field border, as a
 * Soon stage does.
 */
const ROW = "flex w-full justify-start rounded-[9px] border-input/50 px-2.5";
/** Lines an edge's text up with its habit's name: padding, border, icon, gap. */
const EDGE_INDENT = "ps-[calc(--spacing(2.5)+1px+--spacing(4)+--spacing(1.5))]";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** What the Paste habit drops in: a real address, with a copy's stray spaces. */
const PASTED = " Nubelson@Example.com ";
/**
 * What a habit types in when the field is empty, so there's something to send
 * or lose.
 */
const TYPED = "ana@example.com";
const SEND_MS = 400;
const SLOW_MS = 3000;
/** How long you're away from the page under Go back. */
const AWAY_MS = 900;

/**
 * A newsletter signup and six habits real people bring to it: no mouse, a
 * screen reader, a slow network, a paste, going back, a failing server. Each
 * habit is a row in the card; once you hit its rough edge, the row names it,
 * with a Sand button that fixes it in place. The counter above adds up
 * the edges found. `?habit=paste` opens on one habit alone, for embedding a
 * single edge; `controls=off` hides its chip.
 */
export default function FindTheBack({ params }: DemoProps) {
  const only = readChoice<Habit | "">(params, "habit", KEYS, "") || null;
  const id = useId();
  const [active, setActive] = useState<Flags>(() =>
    // An action habit has nothing to leave on: `?habit=paste` pastes instead.
    only && !HABITS.find((habit) => habit.key === only)?.action
      ? { ...NONE, [only]: true }
      : NONE,
  );
  const [found, setFound] = useState<Flags>(NONE);
  const [sanded, setSanded] = useState<Flags>(NONE);
  /** `sanded` as it is now, for timers started before a Sand press. */
  const sandedNow = useRef<Flags>(NONE);
  const [email, setEmail] = useState(
    only === "paste" ? PASTED : only && only !== "reader" ? TYPED : "",
  );
  const [status, setStatus] = useState<Status>("idle");
  const [sends, setSends] = useState(0);
  const [away, setAway] = useState(false);
  /** The habit the hint above the form is walking you through. */
  const [last, setLast] = useState<Habit | null>(only);
  const pending = useRef(0);
  const timers = useRef<number[]>([]);
  const input = useRef<HTMLInputElement>(null);

  const habits = only ? HABITS.filter((habit) => habit.key === only) : HABITS;
  const count = habits.filter((habit) => found[habit.key]).length;

  useEffect(() => {
    const pendingTimers = timers.current;
    return () => pendingTimers.forEach(clearTimeout);
  }, []);

  // Opening on the screen reader habit: the transcript shows the edge at once.
  useEffect(() => {
    if (only === "reader") setFound((now) => ({ ...now, reader: true }));
  }, [only]);

  function later(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  function find(key: Habit) {
    setFound((now) => (now[key] ? now : { ...now, [key]: true }));
    setLast(key);
  }

  function edit(value: string) {
    setEmail(value);
    setStatus("idle");
    setSends(0);
  }

  function setHabit(key: Habit, on: boolean) {
    playSound(on ? "toggle-on" : "toggle-off");
    setActive((now) => ({ ...now, [key]: on }));
    if (!on) {
      if (last === key) setLast(null);
      return;
    }
    setLast(key);
    // Sending habits start with an address in, so the task is one press away.
    if (key !== "reader" && !email) setEmail(TYPED);
    if (key === "mouse") input.current?.focus();
    if (key === "reader" && !sanded.reader) find("reader");
  }

  /** Paste and Go back: one press, one go. */
  function act(key: Habit) {
    playSound("tap");
    setLast(key);
    if (key === "paste") edit(PASTED);
    if (key === "back") {
      if (!email) setEmail(TYPED);
      setAway(true);
      later(() => {
        setAway(false);
        if (sandedNow.current.back) return;
        edit("");
        find("back");
      }, AWAY_MS);
    }
  }

  function submit() {
    // Sanded, a slow request blocks a second send; rough sends every click.
    if (sanded.slow && pending.current > 0) return;
    const value = sanded.paste ? email.trim() : email;
    if (!EMAIL.test(value)) {
      playSound("toggle-off");
      setStatus("invalid");
      // A real address, padded with a paste's stray spaces.
      if (!sanded.paste && email !== email.trim() && EMAIL.test(email.trim()))
        find("paste");
      return;
    }
    if (sanded.paste) setEmail(value.toLowerCase());
    const slow = active.slow;
    const fail = active.fail;
    pending.current += 1;
    setStatus("sending");
    later(
      () => {
        pending.current -= 1;
        if (fail) {
          playSound("toggle-off");
          setStatus("failed");
          if (sandedNow.current.fail) return;
          setEmail("");
          find("fail");
          return;
        }
        playSound("tap");
        setSends((n) => n + 1);
        setStatus("subscribed");
        if (slow && !sandedNow.current.slow) find("slow");
      },
      slow ? SLOW_MS : SEND_MS,
    );
  }

  function sand(key: Habit) {
    playSand();
    sandedNow.current = { ...sandedNow.current, [key]: true };
    setSanded(sandedNow.current);
    setLast(key);
  }

  const sending = status === "sending";
  const message =
    status === "invalid"
      ? "Enter an email like ana@example.com."
      : status === "failed"
        ? sanded.fail
          ? "Couldn't subscribe. Your address is still here: try again."
          : "Something went wrong."
        : status === "subscribed"
          ? sends > 1
            ? `Subscribed ${sends} times.`
            : "You're subscribed."
          : sending && sanded.slow
            ? "Subscribing…"
            : "";
  const inputId = `${id}-email`;
  const controls = showsControls(params, "on");
  // With the controls hidden, a habit has a row only once its edge is found.
  const rows = controls ? habits : habits.filter((habit) => found[habit.key]);
  // One step at a time: the task, then Sand, then try it again.
  const hint = habits.every((habit) => sanded[habit.key])
    ? only
      ? "Sanded. Try it again."
      : "Every edge is sanded."
    : !last
      ? "Pick a habit below, then sign up."
      : sanded[last]
        ? only
          ? "Sanded. Try it again."
          : "Sanded. Try it again, or pick another habit."
        : found[last]
          ? "Found a rough edge. Sand it, then try again."
          : HABITS.find((habit) => habit.key === last)?.task;

  return (
    <MotionConfig reducedMotion="user" transition={SLIDE}>
      <div data-stream className="flex w-full self-stretch">
        <DemoLayout
          top={
            <div className="flex flex-col items-center gap-0.5 px-4 text-center">
              {/* Live, so each next step is read out as it changes. The region
                stays put and only the text inside fades in, since a live
                region that remounts may not be announced. */}
              <output aria-live="polite" className="text-pretty text-sm/5">
                <span
                  key={hint}
                  className="transition-opacity duration-150 ease-(--ease-out) starting:opacity-0"
                >
                  {hint}
                </span>
              </output>
              <span className="font-mono text-muted-foreground text-xs/5">
                Edges found{" "}
                <span
                  key={count}
                  className="inline-block text-foreground tabular-nums transition-[scale,opacity] duration-300 ease-(--ease-out) starting:scale-150 starting:opacity-50 motion-reduce:starting:scale-100"
                >
                  {count}/{habits.length}
                </span>
              </span>
            </div>
          }
        >
          {/* In flow, not pinned to the slot: on a phone the card stacks taller
            than the registry height, and the stage grows with it. */}
          <div className="flex size-full px-4 py-1">
            <motion.section
              layout="position"
              aria-label="Signup"
              className="relative m-auto w-full max-w-[360px] rounded-[25px] border border-border bg-foreground/4 p-4"
            >
              <div className="relative">
                <p
                  aria-hidden={!away}
                  className={cn(
                    "pointer-events-none absolute inset-0 flex items-center justify-center text-muted-foreground text-sm transition-opacity duration-150 ease-(--ease-out)",
                    !away && "opacity-0",
                  )}
                >
                  You left the page…
                </p>
                <div
                  inert={away}
                  className={cn(
                    "relative flex flex-col gap-3 transition-opacity duration-150 ease-(--ease-out)",
                    away && "opacity-0",
                  )}
                >
                  {/* No mouse: the pointer can't reach the form, though the habits
                  below it stay in reach. */}
                  {active.mouse ? (
                    <div
                      aria-hidden
                      className="absolute inset-0 z-10 cursor-not-allowed"
                    />
                  ) : null}
                  <div className="flex flex-col gap-0.5">
                    <h2 className="font-medium text-base">Field notes</h2>
                    <p className="text-muted-foreground text-xs/5">
                      One essay a week. No spam.
                    </p>
                  </div>
                  <form
                    // A function action, not onSubmit, as in sanded-form.
                    action={() => submit()}
                    className="flex flex-col gap-1.5"
                  >
                    <Label htmlFor={inputId}>Email</Label>
                    <div className="flex gap-2">
                      <Input
                        ref={input}
                        id={inputId}
                        name="email"
                        // Text, not email: an email field trims a paste on its own,
                        // and the stray spaces are the point.
                        type="text"
                        inputMode="email"
                        autoComplete="email"
                        value={email}
                        onValueChange={edit}
                        onKeyDown={(event) => {
                          // Rough: Enter submits nothing, and Tab skips the button.
                          if (sanded.mouse) return;
                          const enter = event.key === "Enter";
                          if (enter) event.preventDefault();
                          if (active.mouse && (enter || event.key === "Tab"))
                            find("mouse");
                        }}
                      />
                      <Button
                        type="submit"
                        size="md"
                        variant="solid"
                        className="px-3"
                        tabIndex={sanded.mouse ? undefined : -1}
                        aria-label={sanded.reader ? "Subscribe" : undefined}
                        // Sanded: focusable while it sends, and one send only.
                        disabled={sanded.slow && sending}
                        focusableWhenDisabled
                      >
                        {sanded.slow && sending ? (
                          <LoaderCircle
                            aria-hidden
                            className="motion-safe:animate-spin"
                          />
                        ) : (
                          <ArrowRight aria-hidden />
                        )}
                      </Button>
                    </div>
                  </form>
                  <output
                    aria-live="polite"
                    className="block min-h-5 text-muted-foreground text-xs/5"
                  >
                    {message}
                  </output>
                  {active.reader ? (
                    <p className="flex items-start gap-2 rounded-[9px] bg-foreground/6 px-3 py-2.5 font-mono text-xs/5 transition-opacity duration-200 ease-(--ease-out) starting:opacity-0">
                      <AudioLines
                        aria-hidden
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                      <span>
                        <span className="sr-only">A screen reader says: </span>
                        “Field notes, heading. Email, edit text.{" "}
                        {sanded.reader ? "Subscribe, button." : "button."}”
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>
              {rows.length > 0 ? (
                // The habits live in the card, each beside the edge it exposes
                // and its Sand button, so a phone needs no row of chips below.
                <>
                  <motion.p
                    layout="position"
                    id={`${id}-habits`}
                    className="mt-5 mb-2 text-muted-foreground text-xs/5"
                  >
                    Habits
                  </motion.p>
                  <ul
                    aria-labelledby={`${id}-habits`}
                    className="flex flex-col gap-1"
                  >
                    {rows.map(({ key, name, edge, icon: Icon, action }) => (
                      <motion.li
                        key={key}
                        layout="position"
                        className="flex flex-col"
                      >
                        {/* Sand sits over the row's right end, so every row keeps
                        the card's full width as edges are found. */}
                        <div className="relative">
                          {!controls ? (
                            <span
                              className={cn(
                                ROW,
                                found[key] && "pe-24",
                                "items-center gap-1.5 border border-transparent py-1.5 text-muted-foreground text-sm [&_svg]:size-4 [&_svg]:shrink-0",
                              )}
                            >
                              <Icon aria-hidden />
                              {name}
                            </span>
                          ) : action ? (
                            <Button
                              size="chip"
                              className={cn(ROW, found[key] && "pe-24")}
                              onClick={() => act(key)}
                            >
                              <Icon aria-hidden />
                              {name}
                            </Button>
                          ) : (
                            <Toggle
                              className={cn(ROW, found[key] && "pe-24")}
                              pressed={active[key]}
                              onPressedChange={(on) => setHabit(key, on)}
                            >
                              <Icon aria-hidden />
                              {name}
                            </Toggle>
                          )}
                          {found[key] ? (
                            // One button throughout, so focus stays put as it
                            // turns into "Sanded".
                            <Button
                              size="text"
                              className="absolute end-1 top-1/2 -translate-y-1/2 justify-end pointer-coarse:h-10 transition-opacity duration-200 ease-(--ease-out) starting:opacity-0"
                              aria-label={`${sanded[key] ? "Sanded" : "Sand"}: ${name}`}
                              disabled={sanded[key]}
                              focusableWhenDisabled
                              onClick={() => sand(key)}
                            >
                              {sanded[key] ? (
                                <>
                                  <Check
                                    aria-hidden
                                    className="size-3.5 transition-[scale,opacity] duration-300 ease-(--ease-out) starting:scale-25 starting:opacity-0 motion-reduce:starting:scale-100"
                                  />
                                  Sanded
                                </>
                              ) : (
                                "Sand"
                              )}
                            </Button>
                          ) : null}
                        </div>
                        {found[key] ? (
                          <p
                            className={cn(
                              EDGE_INDENT,
                              "pt-0.5 pb-1.5 text-pretty text-xs/5 transition-[color,opacity] duration-200 ease-(--ease-out) starting:opacity-0",
                              sanded[key] && "text-muted-foreground",
                            )}
                          >
                            {edge}
                          </p>
                        ) : null}
                      </motion.li>
                    ))}
                  </ul>
                </>
              ) : null}
            </motion.section>
          </div>
        </DemoLayout>
      </div>
    </MotionConfig>
  );
}

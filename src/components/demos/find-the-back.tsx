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
 * habit exposes one rough edge; once you hit it, a line under the form names
 * it, with a Sand button that fixes it in place. The counter above adds up
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
        if (sanded.back) return;
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
          if (sanded.fail) return;
          setEmail("");
          find("fail");
          return;
        }
        playSound("tap");
        setSends((n) => n + 1);
        setStatus("subscribed");
        if (slow && !sanded.slow) find("slow");
      },
      slow ? SLOW_MS : SEND_MS,
    );
  }

  function sand(key: Habit) {
    playSand();
    setSanded((now) => ({ ...now, [key]: true }));
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
    <div data-stream className="flex w-full self-stretch">
      <DemoLayout
        top={
          <div className="flex flex-col items-center gap-0.5 px-4 text-center">
            {/* Live, so each next step is read out as it changes. */}
            <output aria-live="polite" className="text-pretty text-sm/5">
              {hint}
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
        bottom={
          showsControls(params, "on") ? (
            <fieldset
              aria-label="Habits"
              className="flex max-w-[460px] flex-wrap justify-center gap-2 px-4"
            >
              {habits.map(({ key, name, icon: Icon, action }) =>
                action ? (
                  <Button key={key} size="chip" onClick={() => act(key)}>
                    <Icon aria-hidden />
                    {name}
                  </Button>
                ) : (
                  <Toggle
                    key={key}
                    pressed={active[key]}
                    onPressedChange={(on) => setHabit(key, on)}
                  >
                    <Icon aria-hidden />
                    {name}
                  </Toggle>
                ),
              )}
            </fieldset>
          ) : null
        }
      >
        {/* Centred while it fits; once every edge is listed on a short frame,
            it scrolls instead of running under the controls. */}
        <div className="absolute inset-0 flex overflow-y-auto overscroll-contain px-4 py-1">
          <section
            aria-label="Signup"
            className="relative m-auto w-full max-w-[340px] rounded-[25px] border border-border bg-foreground/4 p-4"
          >
            {/* No mouse: the pointer can't reach the form. */}
            {active.mouse ? (
              <div
                aria-hidden
                className="absolute inset-0 z-10 cursor-not-allowed rounded-[inherit]"
              />
            ) : null}
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
                "flex flex-col gap-3 transition-opacity duration-150 ease-(--ease-out)",
                away && "opacity-0",
              )}
            >
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
            {count > 0 ? (
              <ul
                aria-label="Rough edges"
                className="mt-4 flex flex-col gap-2 border-border border-t pt-3"
              >
                {habits
                  .filter((habit) => found[habit.key])
                  .map(({ key, name, edge }) => (
                    <li
                      key={key}
                      className="flex items-center gap-2 text-xs/5 transition-opacity duration-200 ease-(--ease-out) starting:opacity-0"
                    >
                      <span
                        className={cn(
                          "min-w-0 flex-1 transition-colors duration-200 ease-(--ease-out)",
                          sanded[key] && "text-muted-foreground",
                        )}
                      >
                        <span className="font-medium text-foreground">
                          {name}:
                        </span>{" "}
                        {edge}
                      </span>
                      {/* One button throughout, so focus stays put as it
                          turns into "Sanded". */}
                      <Button
                        size="text"
                        className="w-20 shrink-0 justify-end"
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
                    </li>
                  ))}
              </ul>
            ) : null}
          </section>
        </div>
      </DemoLayout>
    </div>
  );
}

"use client";

import { Check, Settings, X } from "lucide-react";
import type { DemoProps } from "notionic";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { readChoice } from "@/lib/params";
import { playSound, soundPlayer } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { DemoLayout } from "./controls/demo-layout";
import { showsControls } from "./controls/presets";
import { SegmentedSwitch } from "./controls/segmented-switch";

type Run = "rough" | "sanded";

const START_NAME = "Ana Lima";
/** How long the avatar takes, once you reach the panel: long enough to aim. */
const AVATAR_MS = 700;
/** How long the rough switch waits on its pretend server. */
const TOGGLE_MS = 1000;
/** How long the rough Undo lasts, and its toast with it. The sanded one stays. */
const UNDO_MS = 4000;
/** How long the rough toast takes to sink out. */
const TOAST_EXIT_MS = 150;

const CARD =
  "w-full max-w-[300px] rounded-[25px] border border-border bg-foreground/4 p-4";
// A panel arriving after the first load: a small rise in scale, faded in.
const ENTER =
  "transition-[opacity,scale] duration-200 ease-(--ease-out) starting:scale-[0.97] starting:opacity-0 motion-reduce:starting:scale-100";

// A dull thud: a low body with a little muffled noise, for each cut.
const playThud = soundPlayer({
  layers: [
    {
      source: { type: "sine", frequency: 110 },
      envelope: { decay: 0.12 },
      gain: 0.2,
    },
    {
      source: { type: "noise", color: "pink" },
      filter: { type: "lowpass", frequency: 380 },
      envelope: { decay: 0.06 },
      gain: 0.12,
    },
  ],
});

// A clean tick: a short, high ping, for each step of the sanded run.
const playTick = soundPlayer({
  layers: [
    {
      source: { type: "sine", frequency: 1760 },
      envelope: { decay: 0.04 },
      gain: 0.05,
    },
    {
      source: { type: "noise", color: "pink" },
      filter: { type: "bandpass", frequency: 4200, resonance: 1.4 },
      envelope: { decay: 0.01 },
      gain: 0.2,
    },
  ],
});

/**
 * The settings panel, with one job: a new display name and email
 * notifications on. Rough, it cuts five ways; sanded, it doesn't. `onCut`
 * reports each cut as it lands.
 */
function Panel({
  run,
  enter,
  onCut,
}: {
  run: Run;
  /** Ease in on mount: a fresh run, never the first load. */
  enter: boolean;
  onCut: () => void;
}) {
  const sanded = run === "sanded";
  const id = useId();
  const [open, setOpen] = useState(true);
  const [saved, setSaved] = useState(START_NAME);
  const [draft, setDraft] = useState(START_NAME);
  const [notify, setNotify] = useState(false);
  const [avatar, setAvatar] = useState(false);
  /** The name before the last save, while Undo lasts. */
  const [undo, setUndo] = useState<string | null>(null);
  /** The rough toast's last 150ms, on its way out with Undo. */
  const [leaving, setLeaving] = useState(false);
  // The rough run rebuilds the form on save, by re-keying it.
  const [formKey, setFormKey] = useState(0);
  const panel = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const pointerInside = useRef(false);
  const loading = useRef(false);
  const moved = useRef(false);
  const undoTimer = useRef<number | undefined>(undefined);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // The sanded panel hands focus over as it closes and opens; the rough one
  // drops it on the page.
  useEffect(() => {
    if (!sanded || !moved.current) return;
    (open ? input.current : opener.current)?.focus();
  }, [open, sanded]);

  function later(fn: () => void, ms: number) {
    const timer = window.setTimeout(fn, ms);
    timers.current.push(timer);
    return timer;
  }

  /** The avatar starts loading the first time you reach the panel. */
  function engage() {
    if (loading.current) return;
    loading.current = true;
    later(() => {
      setAvatar(true);
      // Rough saved no room for it, so the rows jump under the hand or caret.
      const busy =
        pointerInside.current ||
        panel.current?.contains(document.activeElement);
      if (!sanded && busy) onCut();
    }, AVATAR_MS);
  }

  function save() {
    const name = draft.trim();
    if (!name || name === saved) return;
    const focused = panel.current
      ?.querySelector("form")
      ?.contains(document.activeElement);
    setUndo(saved);
    setSaved(name);
    setDraft(name);
    clearTimeout(undoTimer.current);
    setLeaving(false);
    // Rough takes Undo away on a timer, the toast sinking out as it goes;
    // sanded leaves it until the next save.
    if (!sanded)
      undoTimer.current = later(() => {
        setLeaving(true);
        undoTimer.current = later(() => {
          setUndo(null);
          setLeaving(false);
        }, TOAST_EXIT_MS);
      }, UNDO_MS);
    if (sanded) {
      playTick();
      return;
    }
    setFormKey((key) => key + 1);
    if (focused) onCut();
  }

  function undoSave() {
    if (undo === null) return;
    playSound("tap");
    setSaved(undo);
    setDraft(undo);
    setUndo(null);
    setLeaving(false);
    clearTimeout(undoTimer.current);
  }

  function toggle(next: boolean) {
    if (sanded) {
      playTick();
      setNotify(next);
      return;
    }
    // It waits on the server and shows nothing meanwhile; press twice and
    // both presses land.
    onCut();
    later(() => setNotify((on) => !on), TOGGLE_MS);
  }

  function close() {
    moved.current = true;
    playSound("tap");
    setOpen(false);
    if (sanded || draft === saved) return;
    setDraft(saved);
    onCut();
  }

  if (!open)
    return (
      <Button
        ref={opener}
        size="text"
        className="starting:opacity-0"
        onClick={() => {
          moved.current = true;
          playSound("tap");
          setOpen(true);
        }}
      >
        <Settings aria-hidden />
        Open settings
      </Button>
    );

  const titleId = `${id}-title`;
  const inputId = `${id}-name`;
  const switchId = `${id}-notify`;
  const switchLabelId = `${switchId}-label`;

  return (
    <dialog
      ref={panel}
      open
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        close();
      }}
      onFocus={engage}
      onPointerEnter={() => {
        pointerInside.current = true;
        engage();
      }}
      onPointerLeave={() => {
        pointerInside.current = false;
      }}
      onPointerDown={(event) => {
        // Pressing the toast means reaching for the Undo under it.
        if ((event.target as Element).closest("[data-toast]")) onCut();
      }}
      className={cn(
        CARD,
        "static m-0 flex flex-col gap-4 text-foreground",
        // Reopened or a fresh run: it eases in, so the swap reads as a new
        // panel. moved is set before the state change that renders this.
        (enter || moved.current) && ENTER,
      )}
    >
      <div className="flex items-center justify-between">
        <h2 id={titleId} className="font-medium text-base">
          Settings
        </h2>
        <Button size="icon-sm" aria-label="Close settings" onClick={close}>
          <X aria-hidden />
        </Button>
      </div>

      {/* Sanded holds the avatar's place from the start; rough adds the row
          when the avatar arrives. */}
      {sanded || avatar ? (
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-10 shrink-0 overflow-hidden rounded-full bg-foreground/10 *:col-start-1 *:row-start-1"
          >
            <span
              className={cn(
                "flex items-center justify-center bg-linear-to-br from-amber-300 to-rose-400 font-medium text-neutral-900 text-sm transition-opacity duration-300 ease-(--ease-out)",
                !avatar && "opacity-0",
              )}
            >
              {saved.charAt(0)}
            </span>
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-sm">{saved}</p>
            <p className="text-muted-foreground text-xs">ana@example.com</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <form
          key={formKey}
          // A function action, not onSubmit, as in sanded-form.
          action={() => save()}
          className="flex flex-col gap-1.5"
        >
          <Label htmlFor={inputId}>Display name</Label>
          <div className="flex gap-2">
            <Input
              ref={input}
              id={inputId}
              name="displayName"
              autoComplete="name"
              value={draft}
              onValueChange={setDraft}
            />
            <Button type="submit" size="md" variant="solid">
              Save
            </Button>
          </div>
        </form>
        {/* Undo's row is always there, so saving shifts nothing. The rough
            toast lands on top of it for exactly as long as Undo lasts. It
            sits outside the form: a form reset would flatten an <output>. */}
        <div className="relative h-7">
          <output
            aria-live="polite"
            className="flex h-full items-center gap-1 text-muted-foreground text-xs"
          >
            {undo !== null && !leaving ? (
              // Fades in, so the save reads as landing; the region itself
              // stays put, so the announcement isn't delayed.
              <span className="flex items-center gap-1 transition-opacity duration-150 ease-(--ease-out) starting:opacity-0">
                Saved.
                <Button size="text" className="-ml-1" onClick={undoSave}>
                  Undo
                </Button>
              </span>
            ) : null}
          </output>
          {!sanded && undo !== null ? (
            // Leaves the way it came, quicker.
            <div
              data-toast
              className={cn(
                "absolute inset-0 flex items-center gap-1.5 rounded-lg bg-foreground px-3 font-medium text-background text-xs transition-[opacity,translate] duration-200 ease-(--ease-out) starting:translate-y-1 starting:opacity-0 motion-reduce:starting:translate-y-0",
                leaving &&
                  "translate-y-1 opacity-0 duration-150 motion-reduce:translate-y-0",
              )}
            >
              <Check aria-hidden className="size-3.5" />
              Changes saved
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Label id={switchLabelId} htmlFor={switchId}>
          Email notifications
        </Label>
        <Switch
          id={switchId}
          aria-labelledby={switchLabelId}
          checked={notify}
          onCheckedChange={toggle}
        />
      </div>
    </dialog>
  );
}

const RUNS = [
  { value: "rough", label: "Rough" },
  { value: "sanded", label: "Sanded" },
] as const;

/**
 * A settings panel with one job: change your display name and turn on email
 * notifications. The rough run works, with five paper cuts, and a counter
 * above ticks up silently with each. Nothing explains them: you feel them.
 * The switch below picks the run (`?run=sanded`), the same task with none,
 * starting it over; `controls=off` hides it.
 */
export default function PaperCuts({ params }: DemoProps) {
  const [run, setRun] = useState<Run>(
    readChoice<Run>(params, "run", ["rough", "sanded"], "rough") ?? "rough",
  );
  const [attempt, setAttempt] = useState(0);
  const [total, setTotal] = useState(0);

  function cut() {
    playThud();
    setTotal((n) => n + 1);
  }

  /** A fresh run: the panel back as it was, no cuts. */
  function start(next: Run) {
    setRun(next);
    setTotal(0);
    setAttempt((n) => n + 1);
  }

  return (
    <div data-stream className="flex w-full self-stretch">
      <DemoLayout
        top={
          // The cuts are silent on purpose: no live region, they only add up.
          <p className="text-center text-muted-foreground text-xs/5">
            Change your display name, then turn on email notifications.{" "}
            <span className="font-mono">
              Cuts{" "}
              <span
                key={total}
                className="inline-block text-foreground tabular-nums transition-[scale,opacity] duration-300 ease-(--ease-out) starting:scale-150 starting:opacity-50 motion-reduce:starting:scale-100"
              >
                {total}
              </span>
            </span>
          </p>
        }
        bottom={
          showsControls(params, "on") ? (
            <SegmentedSwitch
              label="Version"
              options={RUNS}
              value={run}
              onChange={start}
            />
          ) : null
        }
      >
        <div className="flex h-full items-center justify-center px-4">
          <Panel key={attempt} run={run} enter={attempt > 0} onCut={cut} />
        </div>
      </DemoLayout>
    </div>
  );
}

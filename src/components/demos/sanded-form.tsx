"use client";

import { Check, FlipHorizontal2, LoaderCircle, X } from "lucide-react";
import type { DemoProps } from "notionic";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { readChoice } from "@/lib/params";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { DemoLayout } from "./controls/demo-layout";
import { showsControls } from "./controls/presets";

type Variant = "rough" | "sanded";
type Field = "name" | "email" | "phone";
type Values = Record<Field, string>;
export type Errors = Partial<Record<Field, string>>;

const FIELDS: {
  key: Field;
  label: string;
  type: string;
  autoComplete: string;
}[] = [
  { key: "name", label: "Name", type: "text", autoComplete: "name" },
  { key: "email", label: "Email", type: "email", autoComplete: "email" },
  { key: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
];
const VARIANTS: Variant[] = ["rough", "sanded"];
const EMPTY: Values = { name: "", email: "", phone: "" };
/** How long a pretend signup takes, ms: long enough to click twice. */
const SEND_MS = 700;

// The rough form's fields sit in the DOM (so the tab order) as email, phone,
// name, and CSS `order` lays them out as name, email, phone: Tab jumps.
const ROUGH_DOM_ORDER: Field[] = ["email", "phone", "name"];
const LAYOUT_ORDER: Record<Field, string> = {
  name: "order-1",
  email: "order-2",
  phone: "order-3",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?\d{7,15}$/;

/**
 * Which fields are wrong, and why. The rough form takes the phone number as
 * typed, so "+1 555 010 0199" fails; the sanded one drops spaces, dashes and
 * brackets first.
 */
export function validate(values: Values, variant: Variant): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = "Enter your name.";
  if (!EMAIL.test(values.email.trim()))
    errors.email = "Enter an email like ana@example.com.";
  const phone =
    variant === "sanded"
      ? values.phone.replace(/[\s().-]/g, "")
      : values.phone.trim();
  if (!PHONE.test(phone)) errors.phone = "Enter 7 to 15 digits.";
  return errors;
}

/** What "Show the back" says beside each part, per form. */
const NOTES: Record<
  Variant,
  {
    label: string;
    phone: string;
    tab: Record<Field, number>;
  }
> = {
  rough: {
    label: "unlinked",
    phone: "no spaces",
    tab: { email: 1, phone: 2, name: 3 },
  },
  sanded: {
    label: "linked",
    phone: "spaces OK",
    tab: { name: 1, email: 2, phone: 3 },
  },
};

function SignupForm({ variant, back }: { variant: Variant; back: boolean }) {
  const sanded = variant === "sanded";
  const id = useId();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sends, setSends] = useState(0);
  const pending = useRef(0);
  const timers = useRef<number[]>([]);
  const inputs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});
  const notes = NOTES[variant];

  useEffect(() => {
    const pendingTimers = timers.current;
    return () => pendingTimers.forEach(clearTimeout);
  }, []);

  function edit(key: Field, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors(({ [key]: _, ...rest }) => rest);
    setFailed(false);
    setSends(0);
  }

  function submit() {
    // The sanded form sends once; the rough one sends on every click.
    if (sanded && pending.current > 0) return;
    const found = validate(values, variant);
    const invalid = FIELDS.map((f) => f.key).filter((key) => found[key]);
    if (invalid.length > 0) {
      playSound("toggle-off");
      setFailed(true);
      if (sanded) {
        setErrors(found);
        inputs.current[invalid[0]]?.focus();
      } else {
        setValues(EMPTY);
      }
      return;
    }
    setErrors({});
    setFailed(false);
    if (pending.current === 0) setSends(0);
    pending.current += 1;
    setBusy(true);
    timers.current.push(
      window.setTimeout(() => {
        pending.current -= 1;
        setBusy(pending.current > 0);
        setSends((n) => n + 1);
        playSound("tap");
      }, SEND_MS),
    );
  }

  // B says nothing on error: focusing the first wrong field reads its error.
  const status =
    failed && !sanded
      ? "Something went wrong."
      : sanded && busy
        ? "Signing up…"
        : sends === 1
          ? "You're signed up."
          : sends > 1
            ? `Signed up ${sends} times.`
            : "";

  const fields = (sanded ? FIELDS.map((f) => f.key) : ROUGH_DOM_ORDER).map(
    (key) => {
      const field = FIELDS.find((f) => f.key === key) as (typeof FIELDS)[0];
      const inputId = `${id}-${key}`;
      const labelId = `${inputId}-label`;
      const errorId = `${inputId}-error`;
      const error = sanded ? errors[key] : undefined;
      const note =
        key === "name" ? notes.label : key === "phone" ? notes.phone : null;
      return (
        <div
          key={key}
          className={cn("flex flex-col gap-1.5", LAYOUT_ORDER[key])}
        >
          <div className="flex items-baseline justify-between gap-2">
            {/* Rough: the label names the field for screen readers
                (aria-labelledby) but isn't tied to it, so a click does nothing. */}
            <Label id={labelId} htmlFor={sanded ? inputId : undefined}>
              {field.label}
            </Label>
            {note && (
              <span
                aria-hidden={!back || undefined}
                className={cn(
                  "text-end font-mono text-muted-foreground text-xs/4 transition-opacity duration-200 ease-(--ease-out)",
                  !back && "opacity-0",
                )}
              >
                {note}
              </span>
            )}
          </div>
          <div className="relative">
            <Input
              ref={(el) => {
                inputs.current[key] = el;
              }}
              id={inputId}
              name={key}
              type={field.type}
              autoComplete={field.autoComplete}
              required
              value={values[key]}
              onValueChange={(value) => edit(key, value)}
              aria-labelledby={sanded ? undefined : labelId}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={cn(back && "pr-8")}
            />
            {back && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 font-mono text-muted-foreground text-xs"
              >
                ⇥{notes.tab[key]}
              </span>
            )}
          </div>
          {/* The error line folds away while the field is fine, the same way
              as the status line: -mt-1.5 cancels the column's gap, the
              padding sits inside the clip. */}
          <div
            className={cn(
              "-mt-1.5 grid transition-[grid-template-rows,opacity] duration-200 ease-(--ease-out) motion-reduce:transition-opacity",
              error ? "grid-rows-[1fr]" : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <p id={errorId} className="pt-1.5 text-destructive text-xs/4">
                {error}
              </p>
            </div>
          </div>
        </div>
      );
    },
  );

  const action = (
    <>
      <Button
        type={sanded ? "submit" : "button"}
        size="md"
        variant="solid"
        // Focusable while it sends, so focus stays put; Base UI blocks clicks.
        disabled={sanded && busy}
        focusableWhenDisabled
        onClick={sanded ? undefined : submit}
        className="w-full"
      >
        Sign up
        {sanded && busy && (
          <LoaderCircle aria-hidden className="motion-safe:animate-spin" />
        )}
      </Button>
      {/* The status line folds away while it is empty, so the card has no
          blank line under the button: rows 0fr to 1fr, the -mt-2 cancelling
          the column's gap and the padding inside the clip. B's live region
          stays mounted (only clipped), so its announcements still land.
          Under reduced motion the height snaps and only the fade runs. */}
      <div
        className={cn(
          "-mt-2 grid transition-[grid-template-rows,opacity] duration-200 ease-(--ease-out) motion-reduce:transition-opacity",
          status ? "grid-rows-[1fr]" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          {sanded ? (
            <output
              aria-live="polite"
              className="block pt-2 text-muted-foreground text-xs/5"
            >
              {status}
            </output>
          ) : (
            <p className="pt-2 text-muted-foreground text-xs/5">{status}</p>
          )}
        </div>
      </div>
    </>
  );

  const body = (
    <>
      <div className="flex flex-col gap-3">{fields}</div>
      <div className="flex flex-col gap-2">{action}</div>
    </>
  );

  // The rough form is no <form>, so Enter in a field submits nothing.
  return sanded ? (
    <form
      noValidate
      aria-label={`Form ${sanded ? "B" : "A"}`}
      // A function action, not onSubmit: until the page hydrates, React
      // blocks the browser's own submit, which would put the fields in the URL.
      action={() => submit()}
      className="flex min-w-0 flex-col gap-3"
    >
      {body}
    </form>
  ) : (
    <fieldset
      aria-label={`Form ${sanded ? "B" : "A"}`}
      className="flex min-w-0 flex-col gap-3"
    >
      {body}
    </fieldset>
  );
}

/**
 * Under each card: a dark cross for the rough form, a green check for the
 * sanded one. `decorative` when a control around it carries the name.
 */
function Verdict({
  right,
  decorative = false,
}: {
  right: boolean;
  decorative?: boolean;
}) {
  const Icon = right ? Check : X;
  const name = decorative
    ? ({ "aria-hidden": true } as const)
    : ({ role: "img", "aria-label": right ? "Right" : "Wrong" } as const);
  return (
    <span
      {...name}
      className={cn(
        "flex size-5 items-center justify-center rounded-full",
        right ? "bg-green-600 text-white" : "bg-foreground/80 text-background",
      )}
    >
      <Icon aria-hidden className="size-3" strokeWidth={3} />
    </span>
  );
}

/**
 * Two signup forms that look the same. A is rough: its labels don't focus
 * their fields, Tab jumps, Enter does nothing, the phone field rejects
 * spaces, an error wipes every field and the button sends on every click.
 * B is sanded: it fixes all six, announces errors and focuses the first
 * wrong field. "Show the back" (`?back=on`) annotates each difference. A
 * narrow frame shows one form at a time; the verdicts switch between them.
 */
export default function SandedForm({ params }: DemoProps) {
  const initial = readChoice(params, "back", ["off", "on"], "off");
  const [back, setBack] = useState(initial === "on");
  // Which form a narrow frame shows; wide frames show both.
  const [shown, setShown] = useState<Variant>("rough");

  return (
    <div data-stream className="flex w-full self-stretch">
      <DemoLayout
        top={
          // The toggle is how the demo explains itself, so it shows unless
          // controls=off.
          !showsControls(params, "on") ? null : (
            <Toggle
              pressed={back}
              onPressedChange={(next) => {
                playSound(next ? "toggle-on" : "toggle-off");
                setBack(next);
              }}
            >
              <FlipHorizontal2 aria-hidden />
              Show the back
            </Toggle>
          )
        }
      >
        <div className="@container flex h-full items-center justify-center px-4">
          {/* Wide (from 512px, a desktop column): both cards side by side,
              each verdict under its card. The grid keeps the cards one
              height, so the verdicts share a line whatever each card shows.
              Narrow (phones and tablets): one card at a time, and the
              verdicts become the switch between them. */}
          <div className="grid w-full max-w-[600px] gap-y-3 @lg:grid-cols-2 @lg:gap-x-8">
            {VARIANTS.map((variant) => (
              <div
                key={variant}
                className={cn(
                  // A tint, not a surface token: the card reads as raised on
                  // the essay stage (card) and in an embed (background) alike.
                  "min-w-0 rounded-[25px] border border-border bg-foreground/4 p-4",
                  variant !== shown && "@max-lg:hidden",
                )}
              >
                <SignupForm variant={variant} back={back} />
              </div>
            ))}
            {VARIANTS.map((variant) => (
              <div key={variant} className="hidden justify-center @lg:flex">
                <Verdict right={variant === "sanded"} />
              </div>
            ))}
            <ToggleGroup
              aria-label="Form to show"
              value={[shown]}
              onValueChange={([next]) => {
                // One is always shown: pressing the current one keeps it.
                if (!next || next === shown) return;
                playSound("tap");
                setShown(next);
              }}
              className="justify-self-center @lg:hidden"
            >
              {VARIANTS.map((variant) => (
                <ToggleGroupItem
                  key={variant}
                  value={variant}
                  aria-label={
                    variant === "sanded" ? "Form B, right" : "Form A, wrong"
                  }
                >
                  <Verdict right={variant === "sanded"} decorative />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </DemoLayout>
    </div>
  );
}

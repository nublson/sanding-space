"use client";

import { Check, type LucideIcon, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

type State = "idle" | "copied" | "error";

/** How long "Copied" (or the failure) shows before the button resets. */
const FEEDBACK_MS = 1500;

/**
 * Copies `source()` on `copy` and holds the outcome ("copied" or "error")
 * for 1.5 s; a second copy within the window restarts it.
 */
export function useCopy(source: () => string | Promise<string>) {
  const [state, setState] = useState<State>("idle");
  // Counts finished presses, so a second press within the window restarts
  // the feedback even when the state itself doesn't change.
  const [presses, setPresses] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `presses` restarts the timer
  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [state, presses]);

  async function copy() {
    try {
      // No await before this: Safari's tap permission must still hold.
      await copyText(source());
      setState("copied");
    } catch {
      setState("error");
    }
    setPresses((n) => n + 1);
  }

  /** Back to idle at once, e.g. when the copy's menu closes. */
  function reset() {
    setState("idle");
  }

  return { state, copies: presses, copy, reset };
}

/** The idle icon, a check or a retry arrow, by the copy's state. */
export function CopyIcon({
  icon: Icon,
  state,
}: {
  icon: LucideIcon;
  state: State;
}) {
  return (
    // All three stay mounted in one cell, so the swap cross-fades.
    <span className="grid">
      {(
        [
          ["idle", Icon],
          ["copied", Check],
          ["error", RotateCw],
        ] as const
      ).map(([key, Glyph]) => (
        <Glyph
          key={key}
          aria-hidden="true"
          data-icon={key}
          data-shown={state === key}
          className={cn(
            "col-start-1 row-start-1 transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-opacity",
            state === key
              ? "scale-100 opacity-100 blur-none"
              : "scale-25 opacity-0 blur-[4px] motion-reduce:scale-100 motion-reduce:blur-none",
          )}
        />
      ))}
    </span>
  );
}

/**
 * An icon button that copies `source()` and says so: a check and "Copied",
 * or a retry arrow when it failed, both announced and gone after 1.5 s.
 */
export function CopyButton({
  label,
  copiedLabel = "Copied",
  failedLabel,
  icon: Icon,
  source,
  onPrefetch,
  className,
}: {
  label: string;
  copiedLabel?: string;
  failedLabel: string;
  icon: LucideIcon;
  source: () => string | Promise<string>;
  onPrefetch?: () => void;
  className?: string;
}) {
  const { state, copy } = useCopy(source);

  const message =
    state === "copied" ? copiedLabel : state === "error" ? failedLabel : "";

  return (
    <>
      <Tooltip label={message || label}>
        <Button
          data-sound="tap"
          aria-label={message || label}
          onPointerEnter={onPrefetch}
          onTouchStart={onPrefetch}
          onFocus={onPrefetch}
          onClick={copy}
          className={className}
        >
          <CopyIcon icon={Icon} state={state} />
        </Button>
      </Tooltip>
      <output aria-live="polite" className="sr-only">
        {message}
      </output>
    </>
  );
}

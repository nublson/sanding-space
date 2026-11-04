"use client";

import { Check, type LucideIcon, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";

type State = "idle" | "copied" | "error";

/** How long "Copied" (or the failure) shows before the button resets. */
const FEEDBACK_MS = 1500;

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
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      // No await before this: Safari's tap permission must still hold.
      await copyText(source());
      setState("copied");
    } catch {
      setState("error");
    }
  }

  const message =
    state === "copied" ? copiedLabel : state === "error" ? failedLabel : "";

  return (
    <>
      <Button
        data-sound="tap"
        aria-label={message || label}
        onPointerEnter={onPrefetch}
        onTouchStart={onPrefetch}
        onFocus={onPrefetch}
        onClick={copy}
        className={className}
      >
        {state === "copied" ? (
          <Check aria-hidden="true" />
        ) : state === "error" ? (
          <RotateCw aria-hidden="true" />
        ) : (
          <Icon aria-hidden="true" />
        )}
      </Button>
      <output aria-live="polite" className="sr-only">
        {message}
      </output>
    </>
  );
}

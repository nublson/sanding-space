"use client";

import { useRef, useState } from "react";

type State = "idle" | "loading" | "ready" | "error";

// The name carries the state (a spinner while it prepares, a retry arrow
// after a failure show it too).
const LABELS: Record<State, string> = {
  idle: "Share story",
  loading: "Preparing the story",
  ready: "Story ready. Share it",
  error: "Couldn't make the story. Try again",
};

function download(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url));
}

/**
 * Shares the essay's 9:16 story image (`/api/story-image/<slug>`): to the
 * native share sheet where it takes files, as a download elsewhere. Call
 * `prefetch` early (the menu opening) so a tap usually shares at once.
 * `share` resolves "retry" when Safari wants a fresh tap.
 */
export function useStoryImage(slug: string) {
  const [state, setState] = useState<State>("idle");
  const file = useRef<Promise<File> | null>(null);

  function load(): Promise<File> {
    file.current ??= fetch(`/api/story-image/${slug}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`Story image: ${r.status}`);
        return new File([await r.blob()], `${slug}-story.png`, {
          type: "image/png",
        });
      })
      .catch((error) => {
        file.current = null; // the next attempt fetches again
        throw error;
      });
    return file.current;
  }

  function prefetch() {
    load().catch(() => {});
  }

  async function share(): Promise<"done" | "retry" | "error"> {
    if (state === "loading") return "retry";
    // Already fetched: share within Safari's tap window, no "Preparing…".
    if (state !== "ready") setState("loading");
    let image: File;
    try {
      image = await load();
    } catch {
      setState("error");
      return "error";
    }
    // The image is in hand: no "Preparing…" behind the open share sheet.
    setState("idle");
    try {
      // Files only: a url or text drops Instagram from the iOS share sheet.
      if (navigator.share && navigator.canShare?.({ files: [image] }))
        await navigator.share({ files: [image] });
      else download(image);
      setState("idle");
      return "done";
    } catch (error) {
      // DOMException is not always an Error subclass, so read its name directly.
      const name = (error as { name?: string } | null)?.name;
      // Safari opens the sheet only shortly after a tap; the next tap can.
      if (name === "NotAllowedError") {
        setState("ready");
        return "retry";
      }
      if (name === "AbortError") {
        setState("idle");
        return "done";
      }
      setState("error");
      return "error";
    }
  }

  return { state, label: LABELS[state], prefetch, share };
}

"use client";

import { LoaderCircle, RotateCw, Share } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type State = "idle" | "loading" | "ready" | "error";

// An icon button: the name carries the state, and the icon shows it too
// (a spinner while it prepares, a retry arrow after a failure).
const LABELS: Record<State, string> = {
  idle: "Share this post as a story image",
  loading: "Preparing the story image",
  ready: "Story image ready. Share it",
  error: "Couldn't make the story image. Try again",
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
 * native share sheet where it takes files, as a download elsewhere. The PNG is
 * fetched on hover, touch or focus, so a tap usually shares it at once.
 */
export function ShareStory({ slug }: { slug: string }) {
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

  async function share() {
    if (state === "loading") return;
    // Already fetched: share within Safari's tap window, no "Preparing…".
    if (state !== "ready") setState("loading");
    let image: File;
    try {
      image = await load();
    } catch {
      setState("error");
      return;
    }
    try {
      // Files only: a url or text drops Instagram from the iOS share sheet.
      if (navigator.share && navigator.canShare?.({ files: [image] }))
        await navigator.share({ files: [image] });
      else download(image);
      setState("idle");
    } catch (error) {
      // DOMException is not always an Error subclass, so read its name directly.
      const name = (error as { name?: string } | null)?.name;
      // Safari opens the sheet only shortly after a tap; the next tap can.
      if (name === "NotAllowedError") setState("ready");
      else if (name === "AbortError") setState("idle");
      else setState("error");
    }
  }

  return (
    <>
      <Button
        data-sound="tap"
        aria-label={LABELS[state]}
        aria-busy={state === "loading"}
        onPointerEnter={prefetch}
        onTouchStart={prefetch}
        onFocus={prefetch}
        onClick={share}
        // The icon, not the hit area, lines up with the column's edge.
        className="-mr-2 text-subtle-foreground pointer-coarse:-mr-3.5 pointer-coarse:size-11"
      >
        {state === "loading" ? (
          <LoaderCircle
            aria-hidden="true"
            className="motion-safe:animate-spin"
          />
        ) : state === "error" ? (
          <RotateCw aria-hidden="true" />
        ) : (
          <Share aria-hidden="true" />
        )}
      </Button>
      <output aria-live="polite" className="sr-only">
        {state === "error" ? "Couldn't make the story image." : ""}
      </output>
    </>
  );
}

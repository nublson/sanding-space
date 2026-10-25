"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { isMuted, playSound, setMuted } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const MUTE_DELAY_MS = 150;

const icon =
  "absolute transition-[opacity,scale] duration-150 ease-(--ease-out) motion-reduce:transition-none";

export function MuteButton() {
  const [muted, setMutedState] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingMute = useRef(false);

  useEffect(() => {
    setMutedState(isMuted());
    return () => {
      clearTimeout(timer.current);
      // Flush a mute still waiting on its delay so unmounting never drops it.
      if (pendingMute.current) {
        pendingMute.current = false;
        setMuted(true);
      }
    };
  }, []);

  function toggle() {
    clearTimeout(timer.current);
    pendingMute.current = false;
    if (muted) {
      setMuted(false);
      setMutedState(false);
      playSound("toggle-on");
    } else {
      setMutedState(true);
      playSound("toggle-off");
      pendingMute.current = true;
      timer.current = setTimeout(() => {
        pendingMute.current = false;
        setMuted(true);
      }, MUTE_DELAY_MS);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={muted}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      onClick={toggle}
      className="relative size-7 transition-[scale,background-color,color] duration-160 ease-(--ease-out) active:scale-[0.94] active:translate-y-0"
    >
      <Volume2
        aria-hidden
        className={cn(
          icon,
          muted ? "scale-60 opacity-0" : "scale-100 opacity-100",
        )}
      />
      <VolumeX
        aria-hidden
        className={cn(
          icon,
          muted ? "scale-100 opacity-100" : "scale-60 opacity-0",
        )}
      />
    </Button>
  );
}

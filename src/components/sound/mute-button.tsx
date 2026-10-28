"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { isMuted, playSound, setMuted } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const MUTE_DELAY_MS = 150;

const icon =
  "absolute transition-[opacity,scale,filter] duration-150 ease-(--ease-out) motion-reduce:transition-none";

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
      aria-pressed={muted}
      // A toggle keeps one name; aria-pressed carries the state.
      aria-label="Mute sound"
      onClick={toggle}
      className="relative pointer-coarse:size-11 duration-160"
    >
      <Volume2
        aria-hidden
        className={cn(
          icon,
          muted
            ? "scale-25 opacity-0 blur-[4px]"
            : "scale-100 opacity-100 blur-[0px]",
        )}
      />
      <VolumeX
        aria-hidden
        className={cn(
          icon,
          muted
            ? "scale-100 opacity-100 blur-[0px]"
            : "scale-25 opacity-0 blur-[4px]",
        )}
      />
    </Button>
  );
}

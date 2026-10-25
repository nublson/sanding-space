"use client";

import { setMasterVolume } from "@web-kits/audio";
import { type ReactNode, useEffect } from "react";
import { isMuted, playSound, type SoundName } from "@/lib/sounds";

export function SoundRoot({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (isMuted()) setMasterVolume(0);

    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>("[data-sound]");
      if (!el || el.getAttribute("aria-disabled") === "true") return;
      playSound(el.dataset.sound as SoundName);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return children;
}

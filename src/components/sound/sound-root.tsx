"use client";

import { type ReactNode, useEffect } from "react";
import { applySavedMute, playSound, type SoundName } from "@/lib/sounds";

export function SoundRoot({ children }: { children: ReactNode }) {
  useEffect(() => {
    applySavedMute();

    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>("[data-sound]");
      if (!el || el.getAttribute("aria-disabled") === "true") return;
      playSound(el.dataset.sound as SoundName);
    }

    // Hover ticks play once per entered item, for a mouse on a fine pointer
    // only: touch and pen never hover, and a coarse pointer's "hover" is a
    // press that already made its own sound.
    const finePointer = window.matchMedia?.(
      "(hover: hover) and (pointer: fine)",
    );
    let hovered: Element | null = null;
    function onPointerOver(event: PointerEvent) {
      if (event.pointerType !== "mouse" || !finePointer?.matches) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>("[data-sound-hover]");
      if (el === hovered) return;
      hovered = el;
      if (!el || el.getAttribute("aria-disabled") === "true") return;
      playSound(el.dataset.soundHover as SoundName);
    }

    document.addEventListener("click", onClick);
    document.addEventListener("pointerover", onPointerOver);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointerover", onPointerOver);
    };
  }, []);

  return children;
}

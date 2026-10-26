"use client";

import type { DemoProps } from "notionic";
import { useEffect, useRef } from "react";
import { playSound } from "@/lib/sounds";
import {
  createField,
  easePress,
  type Field,
  maxSpeed,
  type Pointer,
  restX,
  restY,
  stepField,
} from "./surface-field";

const LABEL =
  "A field of dots that yields under your pointer. Press and drag to push it; arrow keys move, Space presses.";
/** Keyboard cursor step, px. */
const KEY_STEP = 12;
/** Frames the field may hold still under a steady pointer before the loop idles. */
const QUIET_FRAMES = 12;

type Input = {
  pointer: Pointer | null;
  down: boolean;
  /** Where the pointer was on the previous frame, for velocity. */
  prevX: number;
  prevY: number;
  /** The keyboard cursor, shown while the canvas has keyboard focus. */
  key: { x: number; y: number } | null;
};

export default function Surface(_: DemoProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let field: Field = createField(0, 0);
    let color = "currentColor";
    let press = 0;
    let frame = 0;
    let lastFrame = 0;
    let quiet = 0;
    let onScreen = true;
    const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
    const schemeQuery = matchMedia("(prefers-color-scheme: dark)");
    let reduced = reducedQuery.matches;
    const input: Input = {
      pointer: null,
      down: false,
      prevX: 0,
      prevY: 0,
      key: null,
    };

    function readColor() {
      // Any CSS colour works as a fill style; alpha comes from globalAlpha.
      color = getComputedStyle(canvas as HTMLCanvasElement).color;
    }

    function resize() {
      const box = (root as HTMLDivElement).getBoundingClientRect();
      width = Math.round(box.width);
      height = Math.round(box.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      (canvas as HTMLCanvasElement).width = Math.round(width * dpr);
      (canvas as HTMLCanvasElement).height = Math.round(height * dpr);
      field = createField(width, height);
      readColor();
      // The loop may have idled under a resting pointer; the fresh grid
      // needs a frame to take its push again.
      wake();
    }

    function draw() {
      const c = ctx as CanvasRenderingContext2D;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.globalAlpha = 1;
      c.clearRect(0, 0, width, height);
      c.fillStyle = color;
      const { cols, rows, ox, oy } = field;
      for (let j = 0; j < rows; j++) {
        const y = restY(field, j);
        for (let i = 0; i < cols; i++) {
          const n = j * cols + i;
          const disp = Math.min(1, Math.hypot(ox[n], oy[n]) / 14);
          c.globalAlpha = 0.22 + disp * 0.7;
          c.beginPath();
          c.arc(
            restX(field, i) + ox[n],
            y + oy[n],
            1.6 + disp * 1.4,
            0,
            6.2832,
          );
          c.fill();
        }
      }
      if (input.key) {
        c.globalAlpha = 0.5;
        c.strokeStyle = color;
        c.lineWidth = 1;
        c.beginPath();
        c.arc(input.key.x, input.key.y, 6 + press * 4, 0, 6.2832);
        c.stroke();
      }
    }

    function tick(now: number) {
      frame = 0;
      const dt = lastFrame ? (now - lastFrame) / 1000 : 1 / 60;
      lastFrame = now;
      const p = input.pointer;
      if (p) {
        // Velocity from the frame's displacement, smoothed by half: steadier
        // than per-event samples, and it decays on its own when the pointer
        // stops.
        p.vx = p.vx * 0.5 + ((p.x - input.prevX) / dt) * 0.5;
        p.vy = p.vy * 0.5 + ((p.y - input.prevY) / dt) * 0.5;
        input.prevX = p.x;
        input.prevY = p.y;
      }
      press = easePress(press, input.down, dt);
      const moving = stepField(field, { pointer: p, press, dt, reduced });
      draw();

      if (!p && !moving && press === 0) {
        lastFrame = 0;
        return;
      }
      // Under a resting pointer the dots hold a displaced equilibrium and
      // never "settle"; idle once nothing has changed for a few frames. Any
      // input calls wake().
      const steady =
        p !== null &&
        press === (input.down ? 1 : 0) &&
        Math.hypot(p.vx, p.vy) < 1 &&
        maxSpeed(field) < 1;
      quiet = steady ? quiet + 1 : 0;
      if (quiet > QUIET_FRAMES) lastFrame = 0;
      else schedule();
    }

    function schedule() {
      if (frame || !onScreen || document.hidden) return;
      frame = requestAnimationFrame(tick);
    }

    function wake() {
      quiet = 0;
      if (!frame) lastFrame = 0;
      schedule();
    }

    function local(e: PointerEvent): { x: number; y: number } {
      const box = (canvas as HTMLCanvasElement).getBoundingClientRect();
      return { x: e.clientX - box.left, y: e.clientY - box.top };
    }

    function moveTo(x: number, y: number) {
      if (input.pointer) {
        input.pointer.x = x;
        input.pointer.y = y;
      } else {
        input.pointer = { x, y, vx: 0, vy: 0 };
        input.prevX = x;
        input.prevY = y;
      }
      wake();
    }

    function leave() {
      input.pointer = null;
      input.down = false;
      wake();
    }

    function onPointerMove(e: PointerEvent) {
      if (!e.isPrimary) return;
      const { x, y } = local(e);
      moveTo(x, y);
    }
    function onPointerDown(e: PointerEvent) {
      if (!e.isPrimary || e.button !== 0) return;
      input.down = true;
      const { x, y } = local(e);
      moveTo(x, y);
      playSound("tap");
      try {
        (canvas as HTMLCanvasElement).setPointerCapture(e.pointerId);
      } catch {
        // Capture is best effort; the field still follows the pointer.
      }
    }
    function onPointerUp(e: PointerEvent) {
      if (!e.isPrimary) return;
      input.down = false;
      // Touch ends with no further events: let the surface settle.
      if (e.pointerType !== "mouse") leave();
      else wake();
    }
    function onPointerLeave(e: PointerEvent) {
      if (!e.isPrimary || input.down) return;
      leave();
    }

    function keyCursor(): { x: number; y: number } {
      if (!input.key) input.key = { x: width / 2, y: height / 2 };
      return input.key;
    }
    function onKeyDown(e: KeyboardEvent) {
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-KEY_STEP, 0],
        ArrowRight: [KEY_STEP, 0],
        ArrowUp: [0, -KEY_STEP],
        ArrowDown: [0, KEY_STEP],
      };
      const move = moves[e.key];
      if (move) {
        e.preventDefault();
        const cursor = keyCursor();
        cursor.x = Math.min(width, Math.max(0, cursor.x + move[0]));
        cursor.y = Math.min(height, Math.max(0, cursor.y + move[1]));
        moveTo(cursor.x, cursor.y);
      } else if (e.key === " " || e.key === "Enter") {
        // Every repeat, or holding Space scrolls the page behind the field.
        e.preventDefault();
        if (e.repeat) return;
        const cursor = keyCursor();
        moveTo(cursor.x, cursor.y);
        input.down = true;
        playSound("tap");
        wake();
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Enter") {
        input.down = false;
        wake();
      }
    }
    function onFocus() {
      // Only keyboard focus shows the cursor; a click focuses too, but
      // :focus-visible tells them apart.
      if ((canvas as HTMLCanvasElement).matches(":focus-visible")) {
        keyCursor();
        wake();
      }
    }
    function onBlur() {
      input.key = null;
      leave();
    }

    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else wake();
    }
    function onReducedChange(e: MediaQueryListEvent) {
      reduced = e.matches;
    }
    function onSchemeChange() {
      // A theme=system host switching schemes changes currentColor.
      readColor();
      draw();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    const viewObserver = new IntersectionObserver((records) => {
      onScreen = records.some((r) => r.isIntersecting);
      if (onScreen) wake();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    viewObserver.observe(root);

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", leave);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("keydown", onKeyDown);
    canvas.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("focus", onFocus);
    canvas.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    reducedQuery.addEventListener("change", onReducedChange);
    schemeQuery.addEventListener("change", onSchemeChange);
    resize();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      viewObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", leave);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("focus", onFocus);
      canvas.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      reducedQuery.removeEventListener("change", onReducedChange);
      schemeQuery.removeEventListener("change", onSchemeChange);
    };
  }, []);

  return (
    // Stretch, not height: 100%. Both the stage and the standalone page centre
    // the demo in a flex row, and a percentage collapses to 0 in the latter.
    <div ref={rootRef} data-stream className="relative w-full self-stretch">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        aria-label={LABEL}
        className="absolute inset-0 block h-full w-full touch-pan-y select-none text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      />
    </div>
  );
}

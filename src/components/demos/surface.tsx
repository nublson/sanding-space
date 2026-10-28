"use client";

import type { DemoProps } from "notionic";
import { useEffect, useRef, useState } from "react";
import { readChoice } from "@/lib/params";
import { playSound } from "@/lib/sounds";
import { DemoLayout } from "./controls/demo-layout";
import { SegmentedSwitch } from "./controls/segmented-switch";
import { useGuides } from "./controls/use-guides";
import {
  createField,
  easePress,
  type Field,
  maxSpeed,
  type Pointer,
  type PressMode,
  pressTarget,
  reach,
  restX,
  restY,
  smoothVelocity,
  stepField,
} from "./surface-field";

const LABELS: Record<PressMode, string> = {
  press:
    "A field of dots that yields under your pointer. Press and drag to push it; arrow keys move, Space presses.",
  pressure:
    "A field of dots that yields under your pointer. Press harder, or hold longer, to push deeper; arrow keys move, Space presses.",
};
const MODE_OPTIONS = [
  { value: "press", label: "Press" },
  { value: "pressure", label: "Pressure" },
] as const;
/** Keyboard cursor step, px. */
const KEY_STEP = 12;
/** How long, s, the field may hold still under a steady pointer before the loop idles. */
const QUIET_TIME = 0.2;
/** The guides' value label; the canvas never loads this face on its own. */
const GUIDE_FONT = '12px "Geist Mono", ui-monospace, monospace';
/** Dots are drawn in this many brightness steps, one fill each. */
const ALPHA_STEPS = 8;

type Input = {
  pointer: Pointer | null;
  down: boolean;
  /** Where the pointer was on the previous frame, for velocity. */
  prevX: number;
  prevY: number;
  /** The keyboard cursor, shown while the canvas has keyboard focus. */
  key: { x: number; y: number } | null;
  /** Seconds the current press has been held. */
  heldFor: number;
  /** A pen's pressure, or null for pointers that don't report it. */
  penPressure: number | null;
};

export default function Surface({ params }: DemoProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pressure = readChoice(params, "pressure", ["off", "on"], "off");
  const [mode, setMode] = useState<PressMode>(
    pressure === "on" ? "pressure" : "press",
  );
  const { guides, control } = useGuides(params);
  // The field mounts once; the controls reach its frame loop through refs.
  const modeRef = useRef(mode);
  const guidesRef = useRef(guides);
  const wakeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    modeRef.current = mode;
    guidesRef.current = guides;
    wakeRef.current?.();
  }, [mode, guides]);

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
    let monoRequested = false;
    let disposed = false;
    const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
    const schemeQuery = matchMedia("(prefers-color-scheme: dark)");
    let reduced = reducedQuery.matches;
    const input: Input = {
      pointer: null,
      down: false,
      prevX: 0,
      prevY: 0,
      key: null,
      heldFor: 0,
      penPressure: null,
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
      // One path per brightness step, so a frame is a handful of fills
      // rather than one per dot. Radii stay exact; alpha snaps to 1/8 steps.
      const paths = Array.from({ length: ALPHA_STEPS + 1 }, () => new Path2D());
      const { cols, rows, ox, oy } = field;
      for (let j = 0; j < rows; j++) {
        const y = restY(field, j);
        for (let i = 0; i < cols; i++) {
          const n = j * cols + i;
          const disp = Math.min(1, Math.hypot(ox[n], oy[n]) / 14);
          const path = paths[Math.round(disp * ALPHA_STEPS)];
          const x = restX(field, i) + ox[n];
          const r = 1.6 + disp * 1.4;
          path.moveTo(x + r, y + oy[n]);
          path.arc(x, y + oy[n], r, 0, 6.2832);
        }
      }
      for (let step = 0; step <= ALPHA_STEPS; step++) {
        c.globalAlpha = 0.22 + (step / ALPHA_STEPS) * 0.7;
        c.fill(paths[step]);
      }
      if (input.key) {
        c.globalAlpha = 0.5;
        c.strokeStyle = color;
        c.lineWidth = 1;
        c.beginPath();
        c.arc(input.key.x, input.key.y, 6 + press * 4, 0, 6.2832);
        c.stroke();
      }
      const at = input.pointer ?? input.key;
      if (guidesRef.current && at) drawGuides(c, at);
    }

    /** The pointer's reach, and the press depth beside it. */
    function drawGuides(
      c: CanvasRenderingContext2D,
      at: { x: number; y: number },
    ) {
      const radius = reach(press);
      c.globalAlpha = 1;
      c.strokeStyle = color;
      c.lineWidth = 1;
      c.setLineDash([4, 4]);
      c.beginPath();
      c.arc(at.x, at.y, radius, 0, 6.2832);
      c.stroke();
      c.setLineDash([]);
      const label = press.toFixed(2);
      if (!monoRequested) {
        // Fetch the face only once guides draw, then redraw in it.
        monoRequested = true;
        document.fonts?.load(GUIDE_FONT).then(() => {
          if (!disposed) draw();
        });
      }
      c.font = GUIDE_FONT;
      c.fillStyle = color;
      // Upper right of the ring, kept inside the stage.
      const out = radius * Math.SQRT1_2 + 6;
      const w = c.measureText(label).width;
      const x = Math.min(width - w - 4, Math.max(4, at.x + out));
      const y = Math.min(height - 4, Math.max(14, at.y - out));
      c.fillText(label, x, y);
    }

    function tick(now: number) {
      frame = 0;
      const dt = lastFrame ? (now - lastFrame) / 1000 : 1 / 60;
      lastFrame = now;
      const p = input.pointer;
      if (p) {
        // Velocity from the frame's displacement, smoothed over time: steadier
        // than per-event samples, the same at 60Hz and 120Hz, and it decays
        // on its own when the pointer stops.
        p.vx = smoothVelocity(p.vx, (p.x - input.prevX) / dt, dt);
        p.vy = smoothVelocity(p.vy, (p.y - input.prevY) / dt, dt);
        input.prevX = p.x;
        input.prevY = p.y;
      }
      if (input.down) input.heldFor += dt;
      const target = pressTarget({
        down: input.down,
        mode: modeRef.current,
        heldFor: input.heldFor,
        penPressure: input.penPressure,
      });
      press = easePress(press, target, dt, modeRef.current);
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
        press === target &&
        Math.hypot(p.vx, p.vy) < 1 &&
        maxSpeed(field) < 1;
      quiet = steady ? quiet + dt : 0;
      if (quiet > QUIET_TIME) lastFrame = 0;
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

    function readPressure(e: PointerEvent) {
      // Only pens report real pressure; mouse and touch report a flat 0.5.
      input.penPressure = e.pointerType === "pen" ? e.pressure : null;
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
      readPressure(e);
      const { x, y } = local(e);
      moveTo(x, y);
    }
    function onPointerDown(e: PointerEvent) {
      if (!e.isPrimary || e.button !== 0) return;
      input.down = true;
      input.heldFor = 0;
      readPressure(e);
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
        input.heldFor = 0;
        input.penPressure = null;
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

    wakeRef.current = wake;
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
      disposed = true;
      wakeRef.current = null;
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
    <div data-stream className="flex w-full self-stretch">
      <DemoLayout
        top={control}
        bottom={
          pressure === undefined ? null : (
            <SegmentedSwitch
              label="Press mode"
              options={MODE_OPTIONS}
              value={mode}
              onChange={setMode}
            />
          )
        }
      >
        <div ref={rootRef} className="absolute inset-0">
          <canvas
            ref={canvasRef}
            tabIndex={0}
            aria-label={LABELS[mode]}
            className="absolute inset-0 block h-full w-full touch-pan-y select-none text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          />
        </div>
      </DemoLayout>
    </div>
  );
}

// A frozen frame of the Surface demo for the Open Graph card, computed with the
// demo's own physics: a grid of sprung dots, one press, 200 ms in, still
// ringing outward. The field is simulated in demo units and scaled up, so the
// card is the stage seen closer, with dots that survive feed-size previews.
import {
  createField,
  easePress,
  restX,
  restY,
  stepField,
} from "@/components/demos/surface-field";

/** How long the press has been held when the frame is taken, s. */
export const PRESS_SECONDS = 0.2;
const STEP = 1 / 120;

export type Dot = {
  x: number;
  y: number;
  /** Displacement from rest, 0 to 1, as the demo shades it. */
  d: number;
};

export type Point = { x: number; y: number };

export type Bounds = { x: [number, number]; y: [number, number] };

/** FNV-1a over UTF-16 code units: small, stable, and spread enough for a seed. */
function hash(key: string, seed: number): number {
  let h = (0x811c9dc5 ^ seed) >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h / 0x100000000;
}

/**
 * Where the press lands for a page, from its key (the slug or demo name), so
 * every card has its own crater and the same page always renders the same one.
 */
export function pressPoint(key: string, bounds: Bounds): Point {
  const u = hash(key, 0);
  const v = hash(key, 0x9e3779b9);
  return {
    x: Math.round(bounds.x[0] + (bounds.x[1] - bounds.x[0]) * u),
    y: Math.round(bounds.y[0] + (bounds.y[1] - bounds.y[0]) * v),
  };
}

/**
 * The dots of a `width × height` card at `scale`, pressed at `press` (card
 * coordinates). Positions are in card pixels.
 */
export function surfaceFrame(
  width: number,
  height: number,
  scale: number,
  press: Point,
): Dot[] {
  const field = createField(width / scale, height / scale);
  const pointer = { x: press.x / scale, y: press.y / scale, vx: 0, vy: 0 };
  let depth = 0;
  for (let t = 0; t < PRESS_SECONDS; t += STEP) {
    depth = easePress(depth, true, STEP);
    stepField(field, { pointer, press: depth, dt: STEP, reduced: false });
  }
  const dots: Dot[] = [];
  for (let j = 0; j < field.rows; j++) {
    for (let i = 0; i < field.cols; i++) {
      const n = j * field.cols + i;
      dots.push({
        x: (restX(field, i) + field.ox[n]) * scale,
        y: (restY(field, j) + field.oy[n]) * scale,
        d: Math.min(1, Math.hypot(field.ox[n], field.oy[n]) / 14),
      });
    }
  }
  return dots;
}

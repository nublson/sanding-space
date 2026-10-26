// The physics of the Surface demo: a grid of dots, each on its own spring,
// pushed by the pointer and settling back. Pure functions over typed arrays,
// so the component only draws and the behaviour is testable without a canvas.

export const SPACING = 18;

/** Natural frequency of each spring, rad/s (about 2.9 Hz). */
const OMEGA = 18;
/** Damping ratio: under 1 overshoots and rings; 1 settles without crossing. */
const ZETA = 0.28;
const ZETA_REDUCED = 1;
/** Pointer influence, px: the rest radius and how much a full press adds. */
const RADIUS = 60;
const RADIUS_PRESS = 50;
/** Outward acceleration, px/s², at the pointer when resting and when pressed. */
const PUSH = 1260;
const PUSH_PRESS = 7920;
/** How strongly a moving pointer drags the dots along, 1/s. */
const DRAG = 3;
/** Press depth time constants, s: sinking in is deliberate, letting go snaps. */
const PRESS_IN = 0.16;
const PRESS_OUT = 0.05;
/** Integration step, s. Frames are split into steps no longer than this. */
const MAX_STEP = 1 / 120;
/** Below these a dot is at rest and snaps to zero. */
const REST_OFFSET = 0.02;
const REST_SPEED = 1;

export type Field = {
  cols: number;
  rows: number;
  spacing: number;
  originX: number;
  originY: number;
  /** Offsets from rest and velocities, indexed row-major. */
  ox: Float32Array;
  oy: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
};

export type Pointer = {
  x: number;
  y: number;
  /** px/s */
  vx: number;
  vy: number;
};

export type StepInput = {
  /** Where the pointer is, or null when it is not over the field. */
  pointer: Pointer | null;
  /** 0 at rest, 1 when fully pressed. */
  press: number;
  /** Seconds since the last step. */
  dt: number;
  reduced: boolean;
};

export function createField(
  width: number,
  height: number,
  spacing = SPACING,
): Field {
  const cols = Math.max(0, Math.floor(width / spacing));
  const rows = Math.max(0, Math.floor(height / spacing));
  const n = cols * rows;
  return {
    cols,
    rows,
    spacing,
    originX: (width - (cols - 1) * spacing) / 2,
    originY: (height - (rows - 1) * spacing) / 2,
    ox: new Float32Array(n),
    oy: new Float32Array(n),
    vx: new Float32Array(n),
    vy: new Float32Array(n),
  };
}

/** Rest position of the dot at column `i`, row `j`. */
export function restX(field: Field, i: number): number {
  return field.originX + i * field.spacing;
}
export function restY(field: Field, j: number): number {
  return field.originY + j * field.spacing;
}

/**
 * Advances the field by `dt` seconds and reports whether anything is still
 * moving. Returns false once every dot is at rest, so the caller can stop
 * its frame loop.
 */
export function stepField(field: Field, input: StepInput): boolean {
  const dt = Math.min(input.dt, 1 / 30);
  if (dt <= 0) return isMoving(field);
  const steps = Math.ceil(dt / MAX_STEP);
  const h = dt / steps;
  for (let s = 0; s < steps; s++) integrate(field, input, h);
  return settle(field);
}

function integrate(field: Field, input: StepInput, h: number): void {
  const { cols, rows, ox, oy, vx, vy } = field;
  const { pointer, press } = input;
  const zeta = input.reduced ? ZETA_REDUCED : ZETA;
  const k = OMEGA * OMEGA;
  const c = 2 * zeta * OMEGA;
  const radius = RADIUS + press * RADIUS_PRESS;
  const push = PUSH + press * (PUSH_PRESS - PUSH);

  for (let j = 0; j < rows; j++) {
    const y = restY(field, j);
    for (let i = 0; i < cols; i++) {
      const n = j * cols + i;
      let ax = -k * ox[n] - c * vx[n];
      let ay = -k * oy[n] - c * vy[n];
      if (pointer) {
        const dx = restX(field, i) - pointer.x;
        const dy = y - pointer.y;
        const d = Math.hypot(dx, dy) || 0.01;
        if (d < radius) {
          const f = 1 - d / radius;
          const a = push * f * f;
          ax += (dx / d) * a;
          ay += (dy / d) * a;
          ax += pointer.vx * DRAG * f;
          ay += pointer.vy * DRAG * f;
        }
      }
      // Semi-implicit Euler: stable for these stiffnesses at 1/120 s.
      vx[n] += ax * h;
      vy[n] += ay * h;
      ox[n] += vx[n] * h;
      oy[n] += vy[n] * h;
    }
  }
}

function settle(field: Field): boolean {
  const { ox, oy, vx, vy } = field;
  let moving = false;
  for (let n = 0; n < ox.length; n++) {
    if (
      Math.abs(ox[n]) < REST_OFFSET &&
      Math.abs(oy[n]) < REST_OFFSET &&
      Math.abs(vx[n]) < REST_SPEED &&
      Math.abs(vy[n]) < REST_SPEED
    ) {
      ox[n] = 0;
      oy[n] = 0;
      vx[n] = 0;
      vy[n] = 0;
    } else {
      moving = true;
    }
  }
  return moving;
}

export function isMoving(field: Field): boolean {
  const { ox, oy, vx, vy } = field;
  for (let n = 0; n < ox.length; n++) {
    if (ox[n] !== 0 || oy[n] !== 0 || vx[n] !== 0 || vy[n] !== 0) return true;
  }
  return false;
}

/** The fastest dot, px/s. Zero means the field is holding still. */
export function maxSpeed(field: Field): number {
  const { vx, vy } = field;
  let max = 0;
  for (let n = 0; n < vx.length; n++) {
    const s = vx[n] * vx[n] + vy[n] * vy[n];
    if (s > max) max = s;
  }
  return Math.sqrt(max);
}

/** Eases the press depth toward its target, slower in than out. */
export function easePress(press: number, down: boolean, dt: number): number {
  const target = down ? 1 : 0;
  const tau = down ? PRESS_IN : PRESS_OUT;
  const next = press + (target - press) * (1 - Math.exp(-dt / tau));
  return Math.abs(next - target) < 0.001 ? target : next;
}

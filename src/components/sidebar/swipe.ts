// The mobile sidebar's swipe: a horizontal touch drag moves the shell track
// with the finger, and the release settles it open or shut. Pure decisions
// here, so the component only wires events and the rules stay testable.

/** Movement, px, before a touch commits to an axis. */
export const SWIPE_SLOP = 10;
/** Release speed, px/ms, past which the direction alone decides. */
const FLICK = 0.25;
/** A drag this fast on average, px/ms, over at least DRIFT_MIN px, also decides. */
const DRIFT = 0.11;
const DRIFT_MIN = 24;
/** How far ahead, ms, a slower release is projected before the halfway test. */
const PROJECT = 150;
/** Samples older than this, ms, don't count towards the release speed. */
const VELOCITY_WINDOW = 80;
/** Resistance past either end: lower is stiffer (iOS uses 0.55). */
const RUBBER = 0.55;
/** A carried release lasts between these, ms; the toggle's spring is 400. */
const SETTLE_MIN = 180;
const SETTLE_MAX = 400;
/** Below this speed towards the target, px/ms, the push spring settles instead. */
const SETTLE_CARRY = 0.1;
/** The carried curve: its start matches the finger, its tail is `--ease-out`'s. */
const SETTLE_X1 = 0.2;
const SETTLE_TAIL = "0.32, 1";

/** The track's offset, px, held between shut (`-width`) and open (`0`). */
export function clampOffset(offset: number, width: number): number {
  return Math.min(0, Math.max(-width, offset));
}

/** The offset as drawn: past either end it stretches with rising resistance. */
export function rubberBand(offset: number, width: number): number {
  const past = offset > 0 ? offset : Math.max(0, -width - offset);
  if (past === 0 || width === 0) return offset;
  const stretch = (1 - 1 / ((past * RUBBER) / width + 1)) * width;
  return offset > 0 ? stretch : -width - stretch;
}

/** A computed `translate` such as "-84.4px 0px" as its x, or null for none. */
export function translateX(value: string): number | null {
  const x = Number.parseFloat(value);
  return Number.isFinite(x) ? x : null;
}

export type Sample = { x: number; t: number };

/** Horizontal speed over the last few samples, px/ms; positive is rightwards. */
export function releaseVelocity(samples: Sample[]): number {
  const last = samples.at(-1);
  if (!last) return 0;
  const first =
    samples.find((s) => last.t - s.t <= VELOCITY_WINDOW) ?? samples[0];
  const dt = last.t - first.t;
  return dt > 0 ? (last.x - first.x) / dt : 0;
}

/**
 * Whether a released drag settles open. A flick, or a brisk drag of any
 * length, goes the way it was heading; anything slower settles on the side of
 * halfway it is drifting to.
 */
export function settlesOpen({
  offset,
  velocity,
  travel,
  elapsed,
  width,
}: {
  /** Where the track is, px, held between the ends. */
  offset: number;
  /** Release speed, px/ms. */
  velocity: number;
  /** The whole drag's distance, px, and its duration, ms. */
  travel: number;
  elapsed: number;
  width: number;
}): boolean {
  if (Math.abs(velocity) >= FLICK) return velocity > 0;
  if (
    Math.abs(travel) >= DRIFT_MIN &&
    elapsed > 0 &&
    Math.abs(travel) / elapsed >= DRIFT
  )
    return travel > 0;
  return offset + velocity * PROJECT > -width / 2;
}

/**
 * The transition that carries a release to its target at the finger's speed:
 * shorter the faster and nearer, starting at the release velocity and easing
 * out on the tail of `--ease-out`. Null when the finger was barely moving towards the
 * target, so the push spring settles it from rest as the toggle does.
 */
export function settleTransition(
  distance: number,
  velocity: number,
): string | null {
  const towards = Math.sign(distance) * velocity;
  const d = Math.abs(distance);
  if (d < 1 || towards < SETTLE_CARRY) return null;
  const ms = Math.min(SETTLE_MAX, Math.max(SETTLE_MIN, (2.5 * d) / towards));
  // The curve's starting slope is y1 / x1; in px/ms that is (y1 / x1) * d / ms.
  const y1 = Math.min(1, (SETTLE_X1 * towards * ms) / d);
  return `translate ${Math.round(ms)}ms cubic-bezier(${SETTLE_X1}, ${y1.toFixed(3)}, ${SETTLE_TAIL})`;
}

/**
 * A gesture starting here belongs to the page, not the sidebar: an
 * interactive demo stage, a form field, or anything that scrolls sideways.
 */
export function ownsHorizontalGesture(
  target: EventTarget | null,
  root: Element,
): boolean {
  for (
    let el = target instanceof Element ? target : null;
    el && el !== root;
    el = el.parentElement
  ) {
    if (
      el.matches("[data-swipe-ignore], input, textarea, select") ||
      (el as HTMLElement).isContentEditable
    )
      return true;
    const { overflowX } = getComputedStyle(el);
    if (
      (overflowX === "auto" || overflowX === "scroll") &&
      el.scrollWidth > el.clientWidth
    )
      return true;
  }
  return false;
}

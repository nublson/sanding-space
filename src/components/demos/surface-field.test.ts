import {
  createField,
  easePress,
  type Field,
  HOLD_TIME,
  isMoving,
  maxSpeed,
  type Pointer,
  penPressureFor,
  pressTarget,
  reach,
  restX,
  restY,
  smoothVelocity,
  stepField,
} from "./surface-field";

const FRAME = 1 / 60;

function run(
  field: Field,
  seconds: number,
  pointer: Pointer | null,
  press = 0,
  reduced = false,
  dt = FRAME,
): boolean {
  let moving = true;
  const frames = Math.round(seconds / dt);
  for (let f = 0; f < frames; f++)
    moving = stepField(field, { pointer, press, dt, reduced });
  return moving;
}

function offsetOf(field: Field, i: number, j: number): number {
  const n = j * field.cols + i;
  return Math.hypot(field.ox[n], field.oy[n]);
}

describe("createField", () => {
  it("fills the box on the spacing and centres the grid", () => {
    const field = createField(200, 100, 18);
    expect(field.cols).toBe(11);
    expect(field.rows).toBe(5);
    expect(restX(field, 0) + restX(field, 10)).toBeCloseTo(200);
    expect(restY(field, 0) + restY(field, 4)).toBeCloseTo(100);
    expect(field.ox).toHaveLength(55);
  });
  it("is empty for a box smaller than one dot", () => {
    const field = createField(10, 10, 18);
    expect(field.cols).toBe(0);
    expect(field.ox).toHaveLength(0);
    expect(
      stepField(field, { pointer: null, press: 0, dt: FRAME, reduced: false }),
    ).toBe(false);
  });
});

describe("stepField", () => {
  it("stays at rest with no pointer", () => {
    const field = createField(200, 100);
    expect(run(field, 0.5, null)).toBe(false);
    expect(isMoving(field)).toBe(false);
  });

  it("pushes dots near the pointer away from it and leaves far dots alone", () => {
    const field = createField(400, 200);
    const pointer = { x: restX(field, 5), y: restY(field, 5), vx: 0, vy: 0 };
    run(field, 0.3, pointer, 1);
    const n = 5 * field.cols + 6; // one dot to the right
    expect(field.ox[n]).toBeGreaterThan(1);
    expect(Math.abs(field.oy[n])).toBeLessThan(0.5);
    expect(offsetOf(field, 5, 5)).toBe(0); // dead centre: pushed equally every way
    expect(offsetOf(field, 20, 10)).toBe(0); // far away: untouched and snapped
  });

  it("presses deeper than it hovers", () => {
    const hover = createField(400, 200);
    const pressed = createField(400, 200);
    const pointer = { x: restX(hover, 5), y: restY(hover, 5), vx: 0, vy: 0 };
    run(hover, 0.5, pointer, 0);
    run(pressed, 0.5, pointer, 1);
    expect(offsetOf(pressed, 6, 5)).toBeGreaterThan(offsetOf(hover, 6, 5) * 3);
    expect(offsetOf(hover, 9, 5)).toBe(0); // outside the rest radius
    expect(offsetOf(pressed, 9, 5)).toBeGreaterThan(0); // inside the pressed radius
  });

  it("settles to rest after release and says so", () => {
    const field = createField(400, 200);
    const pointer = { x: restX(field, 5), y: restY(field, 5), vx: 0, vy: 0 };
    run(field, 0.3, pointer, 1);
    expect(run(field, 2, null)).toBe(false);
    expect(isMoving(field)).toBe(false);
    expect(Array.from(field.ox).every((v) => v === 0)).toBe(true);
  });

  it("overshoots on release, but not with reduced motion", () => {
    const crossings = (reduced: boolean) => {
      const field = createField(400, 200);
      const pointer = { x: restX(field, 5), y: restY(field, 5), vx: 0, vy: 0 };
      run(field, 0.3, pointer, 1, reduced);
      const n = 5 * field.cols + 6;
      let sign = Math.sign(field.ox[n]);
      let count = 0;
      for (let t = 0; t < 2; t += FRAME) {
        stepField(field, { pointer: null, press: 0, dt: FRAME, reduced });
        const s = Math.sign(field.ox[n]);
        if (s !== 0 && s !== sign) {
          count++;
          sign = s;
        }
      }
      return count;
    };
    expect(crossings(false)).toBeGreaterThan(0);
    expect(crossings(true)).toBe(0);
  });

  it("drags dots along a moving pointer", () => {
    const field = createField(400, 200);
    const pointer = { x: restX(field, 5), y: restY(field, 5), vx: 600, vy: 0 };
    run(field, 0.1, pointer, 0);
    const above = 3 * field.cols + 5; // two rows up: off the push axis
    expect(field.ox[above]).toBeGreaterThan(0.5);
  });

  it("does not depend on the frame rate", () => {
    const at = (dt: number) => {
      const field = createField(400, 200);
      const pointer = { x: restX(field, 5), y: restY(field, 5), vx: 0, vy: 0 };
      run(field, 0.25, pointer, 1, false, dt);
      run(field, 0.1, null, 0, false, dt);
      return field.ox[5 * field.cols + 6];
    };
    const a = at(1 / 60);
    const b = at(1 / 120);
    expect(Math.abs(a - b)).toBeLessThan(Math.abs(a) * 0.05 + 0.05);
  });

  it("clamps long gaps so a background tab cannot explode", () => {
    const field = createField(400, 200);
    const pointer = { x: restX(field, 5), y: restY(field, 5), vx: 0, vy: 0 };
    run(field, 0.3, pointer, 1);
    stepField(field, { pointer: null, press: 0, dt: 5, reduced: false });
    for (const v of field.ox) expect(Number.isFinite(v)).toBe(true);
    expect(offsetOf(field, 6, 5)).toBeLessThan(30);
  });
});

describe("maxSpeed", () => {
  it("is zero at rest and positive while settling", () => {
    const field = createField(400, 200);
    expect(maxSpeed(field)).toBe(0);
    const pointer = { x: restX(field, 5), y: restY(field, 5), vx: 0, vy: 0 };
    run(field, 0.3, pointer, 1);
    run(field, 0.05, null);
    expect(maxSpeed(field)).toBeGreaterThan(10);
    run(field, 2, null);
    expect(maxSpeed(field)).toBe(0);
  });
});

describe("easePress", () => {
  it("rises toward 1 while down and falls back to exactly 0", () => {
    let press = 0;
    for (let t = 0; t < 0.6; t += FRAME) press = easePress(press, 1, FRAME);
    expect(press).toBeGreaterThan(0.95);
    for (let t = 0; t < 1; t += FRAME) press = easePress(press, 0, FRAME);
    expect(press).toBe(0);
  });
  it("sinks in slower than it lets go", () => {
    let down = 0;
    for (let f = 0; f < 6; f++) down = easePress(down, 1, FRAME);
    let up = 1;
    for (let f = 0; f < 6; f++) up = easePress(up, 0, FRAME);
    expect(down).toBeLessThan(1 - up);
  });
});

describe("smoothVelocity", () => {
  it("weighs a new sample by half at 60Hz, as the demo always has", () => {
    expect(smoothVelocity(0, 100, 1 / 60)).toBeCloseTo(50);
  });

  it("two 120Hz frames smooth exactly as much as one 60Hz frame", () => {
    const once = smoothVelocity(0, 100, 1 / 60);
    const twice = smoothVelocity(smoothVelocity(0, 100, 1 / 120), 100, 1 / 120);
    expect(twice).toBeCloseTo(once);
  });
});

describe("reach", () => {
  it("is 60px at rest and 110px fully pressed", () => {
    expect(reach(0)).toBe(60);
    expect(reach(1)).toBe(110);
    expect(reach(0.5)).toBe(85);
  });
});

describe("pressTarget", () => {
  const base = {
    down: true,
    mode: "pressure" as const,
    heldFor: 0,
    penPressure: null,
  };
  it("is 0 when not down, even for a hovering pen", () => {
    expect(pressTarget({ ...base, down: false, penPressure: 0.8 })).toBe(0);
    expect(pressTarget({ ...base, down: false, mode: "press" })).toBe(0);
  });
  it("is 1 in press mode while down", () => {
    expect(pressTarget({ ...base, mode: "press" })).toBe(1);
  });
  it("follows the pen in pressure mode", () => {
    expect(pressTarget({ ...base, penPressure: 0.35 })).toBe(0.35);
    expect(pressTarget({ ...base, penPressure: 1.4 })).toBe(1);
  });
  it("builds with hold time without a pen", () => {
    expect(pressTarget({ ...base, heldFor: 0 })).toBe(0);
    expect(pressTarget({ ...base, heldFor: HOLD_TIME / 2 })).toBeCloseTo(0.5);
    expect(pressTarget({ ...base, heldFor: HOLD_TIME * 3 })).toBe(1);
  });
});

describe("easePress in pressure mode", () => {
  it("follows faster than press mode sinks in", () => {
    let p = 0;
    let q = 0;
    for (let f = 0; f < 3; f++) {
      p = easePress(p, 1, FRAME, "pressure");
      q = easePress(q, 1, FRAME, "press");
    }
    expect(p).toBeGreaterThan(q);
  });
  it("returns to exactly 0 after release", () => {
    let p = 0.7;
    for (let t = 0; t < 0.5; t += FRAME) p = easePress(p, 0, FRAME, "pressure");
    expect(p).toBe(0);
  });
  it("eases, never jumps, when the target changes mid-press", () => {
    const next = easePress(1, 0.3, FRAME, "pressure");
    expect(next).toBeLessThan(1);
    expect(next).toBeGreaterThan(0.3);
  });
});

describe("penPressureFor", () => {
  const pen = { pointerType: "pen", pressure: 0 };
  it("ignores a hovering pen while the keyboard holds the press", () => {
    expect(penPressureFor(null, pen, "key")).toBeNull();
  });
  it("reads a pen that started the press", () => {
    expect(
      penPressureFor(null, { pointerType: "pen", pressure: 0.6 }, "pointer"),
    ).toBe(0.6);
  });
  it("has no pressure for a mouse or touch press", () => {
    expect(
      penPressureFor(null, { pointerType: "mouse", pressure: 0.5 }, "pointer"),
    ).toBeNull();
  });
  it("keeps the last value when nothing is pressed", () => {
    expect(penPressureFor(0.4, pen, null)).toBe(0.4);
  });
});

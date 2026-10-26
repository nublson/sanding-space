import { SPACING } from "@/components/demos/surface-field";
import { type Bounds, pressPoint, surfaceFrame } from "./surface-frame";

const bounds: Bounds = { x: [760, 1010], y: [170, 330] };

describe("pressPoint", () => {
  it("is deterministic for a key", () => {
    expect(pressPoint("button-press", bounds)).toEqual(
      pressPoint("button-press", bounds),
    );
  });

  it("stays inside the bounds", () => {
    for (const key of ["", "a", "introduction", "sections/motion", "demos/x"]) {
      const p = pressPoint(key, bounds);
      expect(p.x).toBeGreaterThanOrEqual(760);
      expect(p.x).toBeLessThanOrEqual(1010);
      expect(p.y).toBeGreaterThanOrEqual(170);
      expect(p.y).toBeLessThanOrEqual(330);
    }
  });

  it("gives different pages different craters", () => {
    const points = ["button-press", "surface", "introduction", "motion"].map(
      (k) => pressPoint(k, bounds),
    );
    const distinct = new Set(points.map((p) => `${p.x},${p.y}`));
    expect(distinct.size).toBe(points.length);
  });
});

describe("surfaceFrame", () => {
  const scale = 2;
  const dots = surfaceFrame(400, 200, scale, { x: 300, y: 100 });

  it("fills the card with the demo's grid", () => {
    const cols = Math.floor(400 / scale / SPACING);
    const rows = Math.floor(200 / scale / SPACING);
    expect(dots).toHaveLength(cols * rows);
  });

  it("displaces the dots around the press and leaves the far ones at rest", () => {
    const near = dots.filter((p) => Math.hypot(p.x - 300, p.y - 100) < 120);
    const far = dots.filter((p) => Math.hypot(p.x - 300, p.y - 100) > 260);
    expect(near.length).toBeGreaterThan(0);
    expect(far.length).toBeGreaterThan(0);
    expect(Math.max(...near.map((p) => p.d))).toBeGreaterThan(0.5);
    expect(Math.max(...far.map((p) => p.d))).toBe(0);
  });

  it("is deterministic", () => {
    expect(surfaceFrame(400, 200, scale, { x: 300, y: 100 })).toEqual(dots);
  });
});

import {
  clampOffset,
  ownsHorizontalGesture,
  releaseVelocity,
  rubberBand,
  settlesOpen,
  settleTransition,
  translateX,
} from "@/components/sidebar/swipe";

const WIDTH = 208;

describe("clampOffset and rubberBand", () => {
  it("between the ends the track follows the finger exactly", () => {
    expect(clampOffset(-158, WIDTH)).toBe(-158);
    expect(rubberBand(-158, WIDTH)).toBe(-158);
  });

  it("past an end it stretches less and less, never as far as the finger", () => {
    const near = rubberBand(20, WIDTH);
    const far = rubberBand(200, WIDTH);
    expect(near).toBeGreaterThan(0);
    expect(near).toBeLessThan(20);
    expect(far).toBeLessThan(200 / 2);
    expect(far - near).toBeLessThan(200 - 20);
    // Mirrored past the shut end.
    expect(rubberBand(-WIDTH - 20, WIDTH)).toBeCloseTo(-WIDTH - near);
    expect(clampOffset(200, WIDTH)).toBe(0);
    expect(clampOffset(-400, WIDTH)).toBe(-WIDTH);
  });
});

describe("translateX", () => {
  it("reads a computed translate, or null when there is none", () => {
    expect(translateX("-84.4362px")).toBeCloseTo(-84.4362);
    expect(translateX("-208px 0px")).toBe(-208);
    expect(translateX("none")).toBeNull();
    expect(translateX("")).toBeNull();
  });
});

describe("releaseVelocity", () => {
  it("measures the last moments of the drag, not its whole length", () => {
    const samples = [
      { x: 0, t: 0 },
      { x: 10, t: 200 },
      { x: 30, t: 240 },
      { x: 70, t: 280 },
    ];
    // Only the samples within 80ms of the last count: (70 - 10) / 80.
    expect(releaseVelocity(samples)).toBeCloseTo(0.75);
  });

  it("is zero without movement over time", () => {
    expect(releaseVelocity([])).toBe(0);
    expect(releaseVelocity([{ x: 5, t: 10 }])).toBe(0);
  });
});

describe("settlesOpen", () => {
  const slow = { travel: 0, elapsed: 1000, width: WIDTH };

  it("a flick decides by its direction, however short the drag", () => {
    expect(settlesOpen({ ...slow, offset: -190, velocity: 0.3 })).toBe(true);
    expect(settlesOpen({ ...slow, offset: -20, velocity: -0.3 })).toBe(false);
  });

  it("a brisk drag decides by its direction, even if it eased off at the end", () => {
    // 60px in 400ms is 0.15px/ms on average.
    const brisk = { offset: -148, velocity: 0, travel: 60, elapsed: 400 };
    expect(settlesOpen({ ...brisk, width: WIDTH })).toBe(true);
    // Too short to count, however quick.
    expect(
      settlesOpen({ ...brisk, travel: 20, elapsed: 50, width: WIDTH }),
    ).toBe(false);
  });

  it("a slow release settles on the side of halfway it is heading to", () => {
    expect(settlesOpen({ ...slow, offset: -90, velocity: 0 })).toBe(true);
    expect(settlesOpen({ ...slow, offset: -120, velocity: 0 })).toBe(false);
    // Just short of halfway, still drifting open.
    expect(settlesOpen({ ...slow, offset: -120, velocity: 0.2 })).toBe(true);
  });
});

describe("settleTransition", () => {
  it("leaves a barely moving release to the push spring", () => {
    expect(settleTransition(100, 0.05)).toBeNull();
    // Moving away from the target carries nothing towards it.
    expect(settleTransition(100, -1)).toBeNull();
    expect(settleTransition(0.5, 1)).toBeNull();
  });

  it("starts at the finger's speed and ends sooner the faster it was", () => {
    const parse = (t: string | null) => {
      const [, ms, x1, y1] =
        /translate (\d+)ms cubic-bezier\(([\d.]+), ([\d.]+)/.exec(t ?? "") ??
        [];
      return { ms: Number(ms), slope: Number(y1) / Number(x1) };
    };
    const fast = parse(settleTransition(120, 1.5));
    const medium = parse(settleTransition(120, 0.6));
    expect(fast.ms).toBeLessThan(medium.ms);
    // Starting speed in px/ms is slope × distance / duration.
    expect((fast.slope * 120) / fast.ms).toBeCloseTo(1.5, 1);
    expect((medium.slope * 120) / medium.ms).toBeCloseTo(0.6, 1);
    // Never quicker than 180ms, never slower than the 400ms spring.
    expect(parse(settleTransition(30, 5)).ms).toBe(180);
    expect(parse(settleTransition(200, 0.2)).ms).toBe(400);
  });
});

describe("ownsHorizontalGesture", () => {
  it("leaves demo stages, fields and sideways scrollers to the page", () => {
    document.body.innerHTML = `
      <div id="root">
        <p><span id="text">Prose</span></p>
        <div data-swipe-ignore><canvas id="demo"></canvas></div>
        <input id="field" />
        <pre id="code" style="overflow-x: auto"><code id="line">x</code></pre>
      </div>`;
    const root = document.getElementById("root") as HTMLElement;
    const code = document.getElementById("code") as HTMLElement;
    Object.defineProperty(code, "scrollWidth", { value: 900 });
    Object.defineProperty(code, "clientWidth", { value: 300 });
    const at = (id: string) =>
      ownsHorizontalGesture(document.getElementById(id), root);
    expect(at("text")).toBe(false);
    expect(at("demo")).toBe(true);
    expect(at("field")).toBe(true);
    expect(at("line")).toBe(true);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const plays = new Map<string, ReturnType<typeof vi.fn>>();
const definitions: unknown[] = [];
const setMasterVolume = vi.fn();

vi.mock("@web-kits/audio", () => ({
  defineSound: vi.fn((def: unknown) => {
    const play = vi.fn();
    definitions.push(def);
    plays.set(JSON.stringify(def), play);
    return play;
  }),
  setMasterVolume: (v: number) => setMasterVolume(v),
}));

const JITTER = { jitter: { detune: 30, volume: 0.08 } };

const tapDef = {
  source: { type: "triangle", frequency: { start: 1400, end: 900 } },
  envelope: { decay: 0.035 },
  gain: 0.12,
};
const pageDef = {
  source: { type: "noise", color: "pink" },
  filter: {
    type: "bandpass",
    frequency: 700,
    resonance: 1.4,
    envelope: { attack: 0.07, peak: 2800, decay: 0.16 },
  },
  envelope: { attack: 0.05, decay: 0.2 },
  gain: 0.09,
};
const onDef = {
  layers: [
    {
      source: { type: "sine", frequency: 660 },
      envelope: { decay: 0.07 },
      gain: 0.12,
    },
    {
      source: { type: "sine", frequency: 990 },
      envelope: { decay: 0.1 },
      gain: 0.12,
      delay: 0.06,
    },
  ],
};
const offDef = {
  layers: [
    {
      source: { type: "sine", frequency: 990 },
      envelope: { decay: 0.07 },
      gain: 0.12,
    },
    {
      source: { type: "sine", frequency: 660 },
      envelope: { decay: 0.1 },
      gain: 0.12,
      delay: 0.06,
    },
  ],
};

async function load() {
  vi.resetModules();
  plays.clear();
  definitions.length = 0;
  return import("./sounds");
}

describe("sounds", () => {
  beforeEach(() => {
    localStorage.clear();
    setMasterVolume.mockClear();
    vi.useFakeTimers();
  });

  it("definitions match the spec", async () => {
    const { playSound } = await load();
    for (const n of ["tap", "page", "toggle-on", "toggle-off"] as const) {
      playSound(n);
    }
    expect(definitions).toEqual([tapDef, pageDef, onDef, offDef]);
    for (const play of plays.values()) {
      expect(play).toHaveBeenCalledWith(JITTER);
    }
  });

  it("throttles repeats", async () => {
    const { playSound } = await load();
    playSound("tap");
    playSound("tap");
    const play = plays.get(JSON.stringify(tapDef));
    expect(play).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(61);
    playSound("tap");
    expect(play).toHaveBeenCalledTimes(2);
  });

  it("mute", async () => {
    const { playSound, setMuted, isMuted } = await load();
    expect(isMuted()).toBe(false);
    setMuted(true);
    expect(setMasterVolume).toHaveBeenCalledWith(0);
    expect(localStorage.getItem("sanding:muted")).toBe("1");
    expect(isMuted()).toBe(true);
    playSound("tap");
    expect(plays.size).toBe(0);
    setMuted(false);
    expect(setMasterVolume).toHaveBeenLastCalledWith(1);
    expect(isMuted()).toBe(false);
  });
});

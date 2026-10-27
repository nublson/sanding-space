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

function clickDef(transient: number, body: number) {
  return {
    layers: [
      {
        source: { type: "noise", color: "pink" },
        filter: { type: "bandpass", frequency: transient, resonance: 1.6 },
        envelope: { decay: 0.014 },
        gain: 0.3,
      },
      {
        source: { type: "triangle", frequency: body },
        filter: { type: "lowpass", frequency: body * 3 },
        envelope: { decay: 0.055 },
        gain: 0.07,
      },
    ],
  };
}

const tapDef = {
  layers: [
    {
      source: { type: "noise", color: "pink" },
      filter: { type: "bandpass", frequency: 2800, resonance: 1.4 },
      envelope: { decay: 0.015 },
      gain: 0.32,
    },
    {
      source: { type: "sine", frequency: 180 },
      envelope: { decay: 0.04 },
      gain: 0.06,
    },
  ],
};
const pageDef = {
  source: { type: "noise", color: "pink" },
  filter: {
    type: "lowpass",
    frequency: 700,
    resonance: 0.7,
    envelope: { peak: 2200, decay: 0.14 },
  },
  envelope: { attack: 0.012, decay: 0.17 },
  gain: 0.12,
};
const onDef = clickDef(2200, 420);
const offDef = clickDef(1500, 300);
const hoverDef = {
  source: { type: "noise", color: "pink" },
  filter: { type: "bandpass", frequency: 2400, resonance: 2 },
  envelope: { decay: 0.01 },
  gain: 0.36,
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
    const names = ["tap", "page", "toggle-on", "toggle-off", "hover"] as const;
    for (const n of names) {
      playSound(n);
    }
    expect(definitions).toEqual([tapDef, pageDef, onDef, offDef, hoverDef]);
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

  it("applySavedMute silences only when saved as muted", async () => {
    const { applySavedMute } = await load();
    applySavedMute();
    expect(setMasterVolume).not.toHaveBeenCalled();
    localStorage.setItem("sanding:muted", "1");
    applySavedMute();
    expect(setMasterVolume).toHaveBeenCalledWith(0);
  });
});

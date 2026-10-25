import {
  defineSound,
  type PlayOptions,
  type SoundDefinition,
  setMasterVolume,
} from "@web-kits/audio";

export type SoundName = "tap" | "page" | "toggle-on" | "toggle-off";

const STORAGE_KEY = "sanding:muted";
const THROTTLE_MS = 60;
const PLAY_OPTIONS: PlayOptions = { jitter: { detune: 30, volume: 0.08 } };

function notes(first: number, second: number): SoundDefinition {
  return {
    layers: [
      {
        source: { type: "sine", frequency: first },
        envelope: { decay: 0.07 },
        gain: 0.12,
      },
      {
        source: { type: "sine", frequency: second },
        envelope: { decay: 0.1 },
        gain: 0.12,
        delay: 0.06,
      },
    ],
  };
}

const definitions: Record<SoundName, SoundDefinition> = {
  tap: {
    source: { type: "triangle", frequency: { start: 1400, end: 900 } },
    envelope: { decay: 0.035 },
    gain: 0.12,
  },
  page: {
    source: { type: "noise", color: "pink" },
    filter: {
      type: "bandpass",
      frequency: 700,
      resonance: 1.4,
      envelope: { attack: 0.07, peak: 2800, decay: 0.16 },
    },
    envelope: { attack: 0.05, decay: 0.2 },
    gain: 0.09,
  },
  "toggle-on": notes(660, 990),
  "toggle-off": notes(990, 660),
};

// Defined lazily so importing this module on the server never touches the
// Web Audio API.
const players: Partial<Record<SoundName, ReturnType<typeof defineSound>>> = {};
const lastPlayed: Partial<Record<SoundName, number>> = {};

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
  } catch {
    // Storage unavailable: mute still applies for this page view.
  }
  setMasterVolume(muted ? 0 : 1);
}

export function playSound(name: SoundName): void {
  if (typeof window === "undefined" || isMuted()) return;
  const now = Date.now();
  const last = lastPlayed[name];
  if (last !== undefined && now - last < THROTTLE_MS) return;
  lastPlayed[name] = now;
  let player = players[name];
  if (!player) {
    player = defineSound(definitions[name]);
    players[name] = player;
  }
  player(PLAY_OPTIONS);
}

import {
  defineSound,
  type PlayOptions,
  type SoundDefinition,
  setMasterVolume,
} from "@web-kits/audio";

export type SoundName = "tap" | "page" | "toggle-on" | "toggle-off" | "hover";

const STORAGE_KEY = "sanding:muted";
const THROTTLE_MS = 60;
const PLAY_OPTIONS: PlayOptions = { jitter: { detune: 30, volume: 0.08 } };

// A switch click: a short noise transient over a dull, pitched body. The body
// gives the click weight; a brighter transient and higher body read as "on"
// without turning the pair into a melody.
function click(transient: number, body: number): SoundDefinition {
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

const definitions: Record<SoundName, SoundDefinition> = {
  // A fingertip on a hard surface: a dry tick with a little low weight.
  tap: {
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
  },
  // A sheet settling onto a desk: soft noise that darkens as it fades.
  page: {
    source: { type: "noise", color: "pink" },
    filter: {
      type: "lowpass",
      frequency: 700,
      resonance: 0.7,
      envelope: { peak: 2200, decay: 0.14 },
    },
    envelope: { attack: 0.012, decay: 0.17 },
    gain: 0.12,
  },
  "toggle-on": click(2200, 420),
  "toggle-off": click(1500, 300),
  // A fingertip brushing a row: the tap's tick with no body, much quieter
  // and shorter. Only sidebar items on fine pointers play it (SoundRoot).
  hover: {
    source: { type: "noise", color: "pink" },
    filter: { type: "bandpass", frequency: 2400, resonance: 2 },
    envelope: { decay: 0.01 },
    gain: 0.36,
  },
};

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

export function applySavedMute(): void {
  if (isMuted()) setMasterVolume(0);
}

/**
 * A sound's player: defined on first play, so importing this module on the
 * server never touches the Web Audio API. It stays silent while the site is
 * muted, and the same sound can't restart within the throttle. Demos make
 * their own sounds with it.
 */
export function soundPlayer(definition: SoundDefinition): () => void {
  let play: ReturnType<typeof defineSound> | undefined;
  let last: number | undefined;
  return () => {
    if (typeof window === "undefined" || isMuted()) return;
    const now = Date.now();
    if (last !== undefined && now - last < THROTTLE_MS) return;
    last = now;
    play ??= defineSound(definition);
    play(PLAY_OPTIONS);
  };
}

const players = Object.fromEntries(
  Object.entries(definitions).map(([name, definition]) => [
    name,
    soundPlayer(definition),
  ]),
) as Record<SoundName, () => void>;

export function playSound(name: SoundName): void {
  players[name]();
}

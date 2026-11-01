import { soundPlayer } from "@/lib/sounds";

/**
 * A soft rasp: bright grit over a duller scrape, both fading out quickly.
 * The sound of sanding one rough edge, shared by the demos that sand.
 */
export const playSand = soundPlayer({
  layers: [
    {
      source: { type: "noise", color: "white" },
      filter: { type: "bandpass", frequency: 3600, resonance: 0.9 },
      envelope: { attack: 0.03, decay: 0.14 },
      gain: 0.06,
    },
    {
      source: { type: "noise", color: "pink" },
      filter: { type: "lowpass", frequency: 900 },
      envelope: { attack: 0.02, decay: 0.1 },
      gain: 0.08,
    },
  ],
});

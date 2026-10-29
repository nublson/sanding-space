import type { ComponentType } from "react";
import { SandedFormThumbnail } from "./sanded-form";

/**
 * Static card thumbnails, by demo name. Section cards draw a demo's thumbnail
 * instead of its live preview when the demo is too tall or too busy to read
 * at card size. A thumbnail is CSS only: no client JavaScript, and it may
 * play its idea on card hover (the card is a `group`). Demos without one
 * keep the live preview.
 */
export const demoThumbnails: Record<string, ComponentType> = {
  "sanded-form": SandedFormThumbnail,
};

import type { DemoProps, Demos } from "notionic";
import type { ComponentType } from "react";
import ButtonPressScale from "@/components/demos/button-press-scale";
import { RetiredDemo } from "@/components/demos/retired-demo";
import {
  type DemoMeta,
  demoMeta,
  type ResolvedDemo,
  resolveDemo,
  resolveDemoIn,
} from "@/lib/demo-meta";
import { FRAME_PARAM_KEYS } from "@/lib/frame-params";

export const demoComponents: Record<string, ComponentType<DemoProps>> = {
  "button-press-scale": ButtonPressScale,
};

export type DemoEntry = DemoMeta & {
  component: ComponentType<DemoProps>;
};

export const registry: Record<string, DemoEntry> = Object.fromEntries(
  Object.entries(demoMeta).map(([name, meta]) => [
    name,
    { ...meta, component: demoComponents[name] },
  ]),
);

// Frame params (theme, bg, chrome) belong to the /demos route and never reach
// a demo, inline embeds included. No hooks, so this stays a Server Component
// and the inner demo remains a client reference.
export function withoutFrameParams(
  Inner: ComponentType<DemoProps>,
): ComponentType<DemoProps> {
  function FramelessDemo({ name, params }: DemoProps) {
    const rest: Record<string, string> = {};
    for (const [key, value] of Object.entries(params ?? {})) {
      if (!FRAME_PARAM_KEYS.has(key)) rest[key] = value;
    }
    return <Inner name={name} params={rest} />;
  }
  return FramelessDemo;
}

export function deriveDemos(source: Record<string, DemoEntry>): Demos {
  const out: Demos = {};
  for (const [name, entry] of Object.entries(source)) {
    out[name] = entry.retired
      ? () => <RetiredDemo essay={entry.essay} />
      : withoutFrameParams(entry.component);
  }
  // Renamed demos keep rendering inline under their old names.
  for (const [name, entry] of Object.entries(source)) {
    for (const alias of entry.aliases ?? []) {
      if (!Object.hasOwn(out, alias)) out[alias] = out[name];
    }
  }
  return out;
}

export const demos: Demos = deriveDemos(registry);

export { type ResolvedDemo, resolveDemo, resolveDemoIn };

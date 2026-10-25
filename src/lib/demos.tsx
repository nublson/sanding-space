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

const components: Record<string, ComponentType<DemoProps>> = {
  "button-press-scale": ButtonPressScale,
};

export type DemoEntry = DemoMeta & {
  component: ComponentType<DemoProps>;
};

export const registry: Record<string, DemoEntry> = Object.fromEntries(
  Object.entries(demoMeta).map(([name, meta]) => [
    name,
    { ...meta, component: components[name] },
  ]),
);

export function deriveDemos(source: Record<string, DemoEntry>): Demos {
  const out: Demos = {};
  for (const [name, entry] of Object.entries(source)) {
    out[name] = entry.retired
      ? () => <RetiredDemo essay={entry.essay} />
      : entry.component;
  }
  return out;
}

export const demos: Demos = deriveDemos(registry);

export { type ResolvedDemo, resolveDemo, resolveDemoIn };

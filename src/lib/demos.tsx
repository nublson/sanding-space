import type { DemoProps, Demos } from "notionic";
import type { ComponentType } from "react";
import ButtonPressScale from "@/components/demos/button-press-scale";
import { RetiredDemo } from "@/components/demos/retired-demo";

export type DemoEntry = {
  component: ComponentType<DemoProps>;
  title: string;
  essay: string;
  height: number;
  aliases?: string[];
  retired?: boolean;
};

export const registry: Record<string, DemoEntry> = {
  "button-press-scale": {
    component: ButtonPressScale,
    title: "Button press, scale",
    essay: "button-press",
    height: 320,
  },
};

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

export type ResolvedDemo =
  | { kind: "demo"; name: string; entry: DemoEntry }
  | { kind: "alias"; target: string }
  | { kind: "missing" };

export function resolveDemoIn(
  source: Record<string, DemoEntry>,
  name: string,
): ResolvedDemo {
  if (Object.hasOwn(source, name))
    return { kind: "demo", name, entry: source[name] };
  for (const [target, entry] of Object.entries(source)) {
    if (entry.aliases?.includes(name)) return { kind: "alias", target };
  }
  return { kind: "missing" };
}

export function resolveDemo(name: string): ResolvedDemo {
  return resolveDemoIn(registry, name);
}

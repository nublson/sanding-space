"use client";

import type { DemoProps } from "notionic";
import type { ComponentType } from "react";

// Each demo is its own chunk, loaded only on pages that render it. Only a
// Client Component's dynamic import code-splits, so the map lives here.
// e.g. "my-demo": dynamic(() => import("./my-demo")) with `import dynamic from "next/dynamic"`.
const loaders: Record<string, ComponentType<DemoProps>> = {};

export const lazyDemoNames = Object.keys(loaders);

export function LazyDemo(props: DemoProps) {
  const Demo = loaders[props.name];
  return Demo ? <Demo {...props} /> : null;
}

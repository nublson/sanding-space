"use client";

import dynamic from "next/dynamic";
import type { DemoProps } from "notionic";
import type { ComponentType } from "react";

// Each demo is its own chunk, loaded only on pages that render it. Only a
// Client Component's dynamic import code-splits, so the map lives here.
const loaders: Record<string, ComponentType<DemoProps>> = {
  surface: dynamic(() => import("./surface")),
};

export const lazyDemoNames = Object.keys(loaders);

export function LazyDemo(props: DemoProps) {
  const Demo = loaders[props.name];
  return Demo ? <Demo {...props} /> : null;
}

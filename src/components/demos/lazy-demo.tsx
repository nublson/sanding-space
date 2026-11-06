"use client";

import dynamic from "next/dynamic";
import type { DemoProps } from "notionic";
import { type ComponentType, Suspense } from "react";

// Each demo is its own chunk, loaded only on pages that render it. Only a
// Client Component's dynamic import code-splits, so the map lives here.
const loaders: Record<string, ComponentType<DemoProps>> = {
  "find-the-back": dynamic(() => import("./find-the-back")),
  "paper-cuts": dynamic(() => import("./paper-cuts")),
  "sanded-button": dynamic(() => import("./sanded-button")),
  "sanded-form": dynamic(() => import("./sanded-form")),
  "search-expand": dynamic(() => import("./search-expand")),
  surface: dynamic(() => import("./surface")),
};

export const lazyDemoNames = Object.keys(loaders);

// The chunk suspends while it loads. Its own boundary keeps that inside the
// stage: without it the suspension reaches the page's boundary, which hides
// the whole essay behind its skeleton and, mid-navigation, makes the browser
// skip the route's view transition (its new snapshot is no longer rendered).
export function LazyDemo(props: DemoProps) {
  const Demo = loaders[props.name];
  return Demo ? (
    <Suspense fallback={null}>
      <Demo {...props} />
    </Suspense>
  ) : null;
}

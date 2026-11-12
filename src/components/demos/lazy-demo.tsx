"use client";

import dynamic from "next/dynamic";
import type { DemoProps } from "notionic";
import {
  type ComponentType,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";

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

/**
 * A wait longer than this means the parent's fade is well under way when the
 * demo lands. A cached chunk still suspends for a moment; that isn't a wait,
 * and a second fade over the parent's would only soften its start.
 */
const LATE_AFTER_MS = 100;

/** Shown while the chunk loads: nothing, but it tells LazyDemo the wait was long. */
function Waiting({ onLate }: { onLate: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onLate, LATE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [onLate]);
  return null;
}

// The chunk suspends while it loads. Its own boundary keeps that inside the
// stage: without it the suspension reaches the page's boundary, which hides
// the whole essay behind its skeleton and, mid-navigation, makes the browser
// skip the route's view transition (its new snapshot is no longer rendered).
//
// A demo's root fades in (data-stream) unless it sits in a streamed parent,
// which it then rides (a card's InViewMount). A demo whose chunk arrives late
// would ride a fade that has already played and pop in, so after a long wait
// it gets its own fade.
export function LazyDemo(props: DemoProps) {
  const Demo = loaders[props.name];
  const [late, setLate] = useState(false);
  const markLate = useCallback(() => setLate(true), []);
  if (!Demo) return null;
  return (
    <Suspense fallback={<Waiting onLate={markLate} />}>
      {late ? (
        // The stage centres the demo in a flex row; this box stretches the
        // same way, so the demo's own self-stretch root lays out as before.
        <div data-stream-late className="flex w-full self-stretch">
          <Demo {...props} />
        </div>
      ) : (
        <Demo {...props} />
      )}
    </Suspense>
  );
}

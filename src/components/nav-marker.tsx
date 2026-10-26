"use client";

import { useEffect } from "react";

// Longest first-load entrance: 500ms + 240ms stagger, with margin.
const ENTRANCE_MS = 1000;

/**
 * Marks <html data-nav="client"> once the first-load entrance has played, so
 * later pages skip it and the route's view transition is their only entrance.
 * (A marker set after a navigation would be too late: the new page's CSS
 * entrance starts the moment it mounts, under the view transition snapshot.)
 */
export function NavMarker() {
  useEffect(() => {
    const id = window.setTimeout(() => {
      document.documentElement.dataset.nav = "client";
    }, ENTRANCE_MS);
    return () => window.clearTimeout(id);
  }, []);
  return null;
}

import { type ReactNode, ViewTransition } from "react";

/**
 * Crossfade of the main column on route change. It lives in each page, not the
 * layout: layouts persist across navigations, so enter and exit never fire there.
 * Sidebar navigations skip it: the shell moves the whole column instead.
 */
export function PageFade({ children }: { children: ReactNode }) {
  const fade = { "sidebar-nav": "none", default: "page-fade" };
  return (
    <ViewTransition enter={fade} exit={fade} default="none">
      {children}
    </ViewTransition>
  );
}

import { type ReactNode, ViewTransition } from "react";

/**
 * Crossfade of the main column on route change. It lives in each page, not the
 * layout: layouts persist across navigations, so enter and exit never fire there.
 */
export function PageFade({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-fade" exit="page-fade" default="none">
      {children}
    </ViewTransition>
  );
}

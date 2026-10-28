"use client";

import { type ReactNode, useEffect, useRef } from "react";

export function ResizeReporter({
  name,
  minHeight,
  className,
  children,
}: {
  name: string;
  /** The registry height in px: the root never reports less than this. */
  minHeight: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.self === window.top) return;
    // Two parents listen: our embed.js (sanding:resize) and notionic's live
    // embeds (notionic:resize), which fit any frame whose host the page allows.
    const report = () => {
      const height = Math.round(el.getBoundingClientRect().height);
      window.parent.postMessage({ type: "sanding:resize", name, height }, "*");
      window.parent.postMessage({ type: "notionic:resize", height }, "*");
    };
    const observer = new ResizeObserver(report);
    observer.observe(el);
    report();
    return () => observer.disconnect();
  }, [name]);

  return (
    <div
      ref={ref}
      data-resize-root
      className={className}
      style={{ minHeight: `${minHeight}px` }}
    >
      {children}
    </div>
  );
}

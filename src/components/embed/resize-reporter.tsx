"use client";

import { type ReactNode, useEffect, useRef } from "react";

export function ResizeReporter({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.self === window.top) return;
    const report = () => {
      window.parent.postMessage(
        {
          type: "sanding:resize",
          name,
          height: Math.round(el.getBoundingClientRect().height),
        },
        "*",
      );
    };
    const observer = new ResizeObserver(report);
    observer.observe(el);
    report();
    return () => observer.disconnect();
  }, [name]);

  return <div ref={ref}>{children}</div>;
}

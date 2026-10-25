"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

export function InViewMount({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver((records) => {
      if (records.some((r) => r.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex h-full w-full items-center justify-center">
      {visible && (
        <div
          data-stream
          className="flex h-full w-full items-center justify-center"
        >
          {children}
        </div>
      )}
    </div>
  );
}

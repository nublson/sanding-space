"use client";

import { useEffect, useRef, useState, ViewTransition } from "react";
import { DemoStage } from "@/components/stage/demo-stage";
import { resolveDemo } from "@/lib/demos";

export function LiveThumbnail({
  demo,
  essaySlug,
  size,
}: {
  demo: string | null;
  essaySlug: string;
  size: "hero" | "card";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const resolved = demo ? resolveDemo(demo) : null;
  const entry = resolved?.kind === "demo" ? resolved : null;

  useEffect(() => {
    const node = ref.current;
    if (!node || !entry) return;
    const observer = new IntersectionObserver((records) => {
      if (records.some((r) => r.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [entry]);

  const Demo = entry?.entry.component;
  return (
    <div ref={ref}>
      <ViewTransition name={`demo-${essaySlug}`}>
        <DemoStage size={size}>
          {visible && Demo && entry && (
            <div
              data-stream
              className="flex h-full w-full items-center justify-center"
            >
              <Demo name={entry.name} params={{}} />
            </div>
          )}
        </DemoStage>
      </ViewTransition>
    </div>
  );
}

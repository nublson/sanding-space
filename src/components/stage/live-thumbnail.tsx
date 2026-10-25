import { ViewTransition } from "react";
import { DemoStage } from "@/components/stage/demo-stage";
import { InViewMount } from "@/components/stage/in-view-mount";
import { demos, resolveDemo } from "@/lib/demos";

function targetName(demo: string | null): string | null {
  if (!demo) return null;
  const resolved = resolveDemo(demo);
  if (resolved.kind === "demo") return resolved.name;
  if (resolved.kind === "alias") return resolved.target;
  return null;
}

export function LiveThumbnail({
  demo,
  essaySlug,
  size,
  preview = false,
}: {
  demo: string | null;
  essaySlug: string;
  size: "hero" | "card";
  /** Render as a non-interactive preview, for thumbnails inside links. */
  preview?: boolean;
}) {
  const name = targetName(demo);
  const Demo = name ? demos[name] : undefined;
  return (
    <ViewTransition name={`demo-${essaySlug}`}>
      <DemoStage size={size} preview={preview}>
        {name && Demo && (
          <InViewMount>
            <Demo name={name} params={{}} />
          </InViewMount>
        )}
      </DemoStage>
    </ViewTransition>
  );
}

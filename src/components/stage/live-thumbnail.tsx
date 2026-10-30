import { ViewTransition } from "react";
import { demoThumbnails } from "@/components/demos/thumbnails";
import { DemoStage, essayStageHeight } from "@/components/stage/demo-stage";
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
  bleed = false,
}: {
  demo: string | null;
  essaySlug: string;
  size: "essay" | "hero" | "card";
  /** Render as a non-interactive preview, for thumbnails inside links. */
  preview?: boolean;
  /** Edge to edge on phones, for the essay page's stage. */
  bleed?: boolean;
}) {
  const name = targetName(demo);
  const Demo = name ? demos[name] : undefined;
  // In a card, a demo with a static thumbnail draws that instead: no demo
  // JavaScript, and nothing cropped by the card's shape.
  const Thumbnail = preview && name ? demoThumbnails[name] : undefined;
  return (
    <ViewTransition name={`demo-${essaySlug}`}>
      <DemoStage
        size={size}
        height={essayStageHeight(name)}
        preview={preview}
        bleed={bleed}
      >
        {Thumbnail ? (
          <Thumbnail />
        ) : (
          name &&
          Demo && (
            <InViewMount>
              <Demo name={name} params={{}} />
            </InViewMount>
          )
        )}
      </DemoStage>
    </ViewTransition>
  );
}

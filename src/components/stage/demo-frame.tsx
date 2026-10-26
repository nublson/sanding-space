import { type DemoFrameProps, RichText } from "notionic";
import { DemoStage } from "@/components/stage/demo-stage";

export function SiteDemoFrame({ caption, context, children }: DemoFrameProps) {
  return (
    <figure className="m-0">
      <DemoStage size="hero">{children}</DemoStage>
      {caption.length > 0 && (
        <figcaption className="mt-2.5 text-center text-sm/5 text-subtle-foreground">
          <RichText text={caption} context={context} />
        </figcaption>
      )}
    </figure>
  );
}

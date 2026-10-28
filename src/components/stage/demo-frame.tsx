import { type DemoFrameProps, RichText } from "notionic";
import { DemoStage, essayStageHeight } from "@/components/stage/demo-stage";

export function SiteDemoFrame({
  name,
  caption,
  context,
  children,
}: DemoFrameProps) {
  return (
    <figure className="m-0">
      <DemoStage size="essay" height={essayStageHeight(name)}>
        {children}
      </DemoStage>
      {caption.length > 0 && (
        <figcaption className="mt-2.5 text-center text-sm/5 text-subtle-foreground max-md:text-[13px]">
          <RichText text={caption} context={context} />
        </figcaption>
      )}
    </figure>
  );
}

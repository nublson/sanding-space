import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

/**
 * An on/off setting: a track whose thumb slides across while checked. Name it
 * with a `Label` (`htmlFor` and `aria-labelledby`, as Base UI's hidden input
 * takes the id). On touch screens it hits at 44px; under reduced motion the
 * thumb neither stretches on press nor slides, and only its color fades.
 */
function Switch({
  className,
  ...props
}: Omit<SwitchPrimitive.Root.Props, "className"> & { className?: string }) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "group/switch relative inline-flex h-5 w-9 pointer-coarse:before:absolute pointer-coarse:before:-inset-3 shrink-0 items-center rounded-full bg-foreground/15 p-0.5 outline-none transition-colors duration-150 ease-(--ease-out) focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-foreground",
        className,
      )}
      {...props}
    >
      {/* Pressed, the thumb stretches toward the side it is about to slide
          to, anchored on the edge it rests against, so the press reads
          before the slide. */}
      <SwitchPrimitive.Thumb className="size-4 origin-left rounded-full bg-muted-foreground transition-[translate,scale,background-color] duration-150 ease-(--ease-out) group-active/switch:scale-x-125 data-checked:origin-right data-checked:translate-x-4 data-checked:bg-background motion-reduce:transition-[background-color] motion-reduce:group-active/switch:scale-x-100" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };

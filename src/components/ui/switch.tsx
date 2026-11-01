import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

/**
 * An on/off setting: a track whose thumb slides across while checked. Name it
 * with a `Label` (`htmlFor` and `aria-labelledby`, as Base UI's hidden input
 * takes the id). On touch screens it hits at 44px; under reduced motion the
 * thumb jumps and only its color fades.
 */
function Switch({
  className,
  ...props
}: Omit<SwitchPrimitive.Root.Props, "className"> & { className?: string }) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "relative inline-flex h-5 w-9 pointer-coarse:before:absolute pointer-coarse:before:-inset-3 shrink-0 items-center rounded-full bg-foreground/15 p-0.5 outline-none transition-colors duration-150 ease-(--ease-out) focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-foreground",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="size-4 rounded-full bg-muted-foreground transition-[translate,background-color] duration-150 ease-(--ease-out) data-checked:translate-x-4 data-checked:bg-background motion-reduce:transition-[background-color]" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };

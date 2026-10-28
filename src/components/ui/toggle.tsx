import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cn } from "@/lib/utils";

/** A dashed chip that fills while pressed: a demo's on/off control. */
function Toggle({
  className,
  ...props
}: Omit<TogglePrimitive.Props, "className"> & { className?: string }) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border border-dashed px-3.5 py-1.5 pointer-coarse:min-h-11 text-muted-foreground text-sm outline-none transition-colors duration-150 ease-(--ease-out) hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-pressed:border-foreground/40 data-pressed:bg-foreground/7 data-pressed:text-foreground [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export { Toggle };

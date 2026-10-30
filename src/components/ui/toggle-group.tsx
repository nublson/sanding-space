import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { cn } from "@/lib/utils";

/**
 * A row of icon toggles, one pressed at a time: a demo's either/or control.
 * Arrow keys move between the items; name each item with `aria-label`.
 */
function ToggleGroup<Value extends string>({
  className,
  ...props
}: Omit<ToggleGroupPrimitive.Props<Value>, "className"> & {
  className?: string;
}) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      className={cn("inline-flex items-center gap-2", className)}
      {...props}
    />
  );
}

/**
 * One item: pressed, its icon at full ink on a soft disc; otherwise faded,
 * but no further than 3:1 for a colored icon.
 */
function ToggleGroupItem<Value extends string>({
  className,
  ...props
}: Omit<TogglePrimitive.Props<Value>, "className"> & { className?: string }) {
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full opacity-70 outline-none transition-[opacity,background-color] duration-150 ease-(--ease-out) pointer-coarse:size-11 hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring data-pressed:bg-foreground/10 data-pressed:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };

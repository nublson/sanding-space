import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@/lib/utils";

const sizes = {
  icon: "size-8",
  "icon-sm": "size-7",
} as const;

/**
 * A quiet icon button: muted ink and no fill until hovered. Size it with
 * `size`; the icon inside draws at 16px unless it sets its own size.
 */
function Button({
  className,
  size = "icon",
  ...props
}: Omit<ButtonPrimitive.Props, "className"> & {
  className?: string;
  size?: keyof typeof sizes;
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-lg text-muted-foreground outline-none transition-[color,background-color,scale,opacity] duration-150 ease-(--ease-out) hover:bg-muted/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 motion-reduce:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export { Button };

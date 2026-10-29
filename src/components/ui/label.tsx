import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** A form field's name, above its control. */
function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: callers pass htmlFor
    <label
      data-slot="label"
      className={cn("font-medium text-foreground text-sm/5", className)}
      {...props}
    />
  );
}

export { Label };

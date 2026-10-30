import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";

function Input({
  className,
  ...props
}: Omit<InputPrimitive.Props, "className"> & { className?: string }) {
  return (
    <InputPrimitive
      data-slot="input"
      className={cn(
        // 16px on touch screens, so iOS doesn't zoom the page on focus.
        // Focus wins over the invalid border: the faint ring alone isn't
        // 3:1, and the error text still marks the field.
        "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 text-foreground text-sm any-pointer-coarse:text-base outline-none transition-colors duration-150 ease-(--ease-out) placeholder:text-muted-foreground hover:border-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:not-focus-visible:border-destructive data-invalid:not-focus-visible:border-destructive [&::-webkit-search-cancel-button]:appearance-none",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

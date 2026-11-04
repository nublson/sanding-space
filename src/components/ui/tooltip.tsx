import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import type { ReactElement } from "react";

/**
 * Shares one delay across the tooltips inside it: after the first opens,
 * moving to a neighbor shows its tooltip at once.
 */
const TooltipProvider = TooltipPrimitive.Provider;

/**
 * A short visual label for a control, on hover and keyboard focus. Visual
 * only: the control keeps its own `aria-label`, which should say the same.
 * `children` is the control itself (one element, e.g. our `Button`).
 */
function Tooltip({
  label,
  side = "top",
  children,
}: {
  label: string;
  side?: TooltipPrimitive.Positioner.Props["side"];
  children: ReactElement;
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger render={children} />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner
          side={side}
          sideOffset={6}
          collisionPadding={16}
          className="z-50"
        >
          <TooltipPrimitive.Popup
            data-slot="tooltip"
            className="origin-(--transform-origin) rounded-md border border-border bg-popover px-2 py-1 text-popover-foreground text-xs/4 shadow-md transition-[opacity,scale] duration-150 ease-(--ease-out) data-ending-style:scale-95 data-starting-style:scale-95 data-ending-style:opacity-0 data-starting-style:opacity-0 data-instant:transition-none motion-reduce:transition-none"
          >
            {label}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export { Tooltip, TooltipProvider };

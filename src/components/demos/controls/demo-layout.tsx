import type { ReactNode } from "react";

/**
 * A demo with its controls: an optional `top` (the Guides chip), the subject,
 * and an optional `bottom` (a segmented switch). The subject fills whatever
 * height the controls leave, so a canvas can measure its slot.
 */
export function DemoLayout({
  top,
  bottom,
  children,
}: {
  top?: ReactNode;
  bottom?: ReactNode;
  children: ReactNode;
}) {
  return (
    // Stretch, not height: 100%. Both the stage and the standalone page centre
    // the demo in a flex row, and a percentage collapses to 0 in the latter.
    <div className="flex w-full flex-col items-center gap-3 self-stretch py-3 has-[>:only-child]:py-0">
      {top ? <div className="shrink-0">{top}</div> : null}
      <div className="relative min-h-0 w-full flex-1 self-stretch">
        {children}
      </div>
      {bottom ? <div className="shrink-0">{bottom}</div> : null}
    </div>
  );
}

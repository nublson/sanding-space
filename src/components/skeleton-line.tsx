import { cn } from "@/lib/utils";

/** A line's width as a share of the column; `mobile` lines show below md only. */
export type SkeletonLineSpec = { width: string; mobile?: boolean };

/**
 * Lines of text that haven't arrived yet: each is a box with the text's line
 * height (`lineClassName`) holding a quiet bar about as tall as its letters.
 * Text wraps to more lines on a phone, so `mobile` lines add rows below md
 * and the block keeps the real text's height at both sizes. Static, no
 * shimmer (spec §11.5).
 */
export function SkeletonLines({
  lines,
  lineClassName,
  className,
}: {
  lines: SkeletonLineSpec[];
  lineClassName: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {lines.map((line, i) => (
        <span
          // Fixed placeholder rows: the position is the identity.
          // biome-ignore lint/suspicious/noArrayIndexKey: static list
          key={i}
          className={cn(
            "flex items-center",
            lineClassName,
            line.mobile && "md:hidden",
          )}
        >
          <span
            className="h-2.5 rounded-full bg-card max-md:h-2"
            style={{ width: line.width }}
          />
        </span>
      ))}
    </div>
  );
}

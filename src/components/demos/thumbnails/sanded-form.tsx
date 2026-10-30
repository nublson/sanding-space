import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Value bars per field, so the three rows don't read as one stripe.
const FILLS = ["w-[45%]", "w-[70%]", "w-[55%]"];

/**
 * Two small signup cards that look the same. On card hover, A's fields empty
 * out (an error wiped them) while B's stay, and each shows its verdict;
 * keyboard focus shows the same.
 * Everything is sized in em off the card's width, so the drawing fits a 2:1
 * hero and a 4:3 grid card alike.
 */
export function SandedFormThumbnail() {
  return (
    <div className="@container flex size-full items-center justify-center">
      <div className="flex gap-[1.5em] text-[2.4cqw]">
        {(["rough", "sanded"] as const).map((variant) => {
          const sanded = variant === "sanded";
          const Icon = sanded ? Check : X;
          return (
            // The verdict hangs below its card, out of the layout, so the
            // cards sit centred in the stage at rest.
            <div key={variant} className="relative">
              <div className="flex w-[11em] flex-col gap-[0.7em] rounded-[1.5em] border border-border bg-background p-[1em]">
                {FILLS.map((fill) => (
                  <div key={fill} className="flex flex-col gap-[0.4em]">
                    <span className="h-[0.45em] w-[3em] rounded-full bg-muted-foreground/40" />
                    <span className="flex h-[1.7em] items-center rounded-[0.5em] border border-input px-[0.6em]">
                      <span
                        className={cn(
                          "h-[0.45em] rounded-full bg-foreground/70",
                          fill,
                          !sanded &&
                            "transition-opacity duration-200 ease-(--ease-out) group-hover:opacity-0 group-focus-visible:opacity-0",
                        )}
                      />
                    </span>
                  </div>
                ))}
                <span className="mt-[0.3em] h-[1.8em] rounded-[0.5em] bg-foreground" />
              </div>
              <span
                className={cn(
                  "absolute inset-x-0 top-full mx-auto mt-[0.7em] flex size-[1.6em] items-center justify-center rounded-full opacity-0 transition-opacity duration-200 ease-(--ease-out) group-hover:opacity-100 group-focus-visible:opacity-100",
                  sanded
                    ? "bg-green-600 text-white"
                    : "bg-foreground/80 text-background",
                )}
              >
                <Icon className="size-[1em]" strokeWidth={3} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

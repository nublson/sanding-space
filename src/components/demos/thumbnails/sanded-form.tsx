import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Value bars per field, so the three rows don't read as one stripe, and the
// delay A's bar clears at on reveal: top to bottom, like a wipe.
const FILLS = [
  {
    width: "w-[45%]",
    delay: "",
  },
  {
    width: "w-[70%]",
    delay: "group-hover:delay-40 group-focus-visible:delay-40",
  },
  {
    width: "w-[55%]",
    delay: "group-hover:delay-80 group-focus-visible:delay-80",
  },
];

// Delays apply only on the way in (the hover state), so leaving reverses at
// once; reduced motion drops them, since the global rule shortens durations
// but not delays.
const NO_DELAY_REDUCED =
  "motion-reduce:group-hover:delay-0 motion-reduce:group-focus-visible:delay-0";

/**
 * Two small signup cards that look the same. On card hover, A's fields empty
 * out (an error wiped them) while B's stay, and each shows its verdict;
 * keyboard focus shows the same.
 * The reveal reads as cause then effect: A's values clear, then the verdicts
 * land. Everything is sized in em off the smaller of the stage's width and
 * height, so the drawing fills a 2:1 hero and a 4:3 grid card alike.
 */
export function SandedFormThumbnail() {
  return (
    <div className="flex size-full [container-type:size] items-center justify-center">
      <div className="flex gap-[1.5em] text-[min(3.4cqw,4.9cqh)]">
        {(["rough", "sanded"] as const).map((variant) => {
          const sanded = variant === "sanded";
          const Icon = sanded ? Check : X;
          return (
            // The verdict hangs below its card, out of the layout, so the
            // cards sit centred in the stage at rest.
            <div key={variant} className="relative">
              <div className="flex w-[11em] flex-col gap-[0.7em] rounded-[1.5em] border border-border bg-background p-[1em]">
                {FILLS.map(({ width, delay }) => (
                  <div key={width} className="flex flex-col gap-[0.4em]">
                    <span className="h-[0.45em] w-[3em] rounded-full bg-muted-foreground/40" />
                    <span className="flex h-[1.7em] items-center rounded-[0.5em] border border-input px-[0.6em]">
                      <span
                        className={cn(
                          "h-[0.45em] rounded-full bg-foreground/70",
                          width,
                          !sanded && [
                            "transition-opacity duration-150 ease-(--ease-out) group-hover:opacity-0 group-focus-visible:opacity-0",
                            delay,
                            NO_DELAY_REDUCED,
                          ],
                        )}
                      />
                    </span>
                  </div>
                ))}
                <span className="mt-[0.3em] h-[1.8em] rounded-[0.5em] bg-foreground" />
              </div>
              <span
                className={cn(
                  "absolute inset-x-0 top-full mx-auto mt-[0.7em] flex size-[1.6em] items-center justify-center rounded-full scale-90 opacity-0 transition-[opacity,scale] duration-200 ease-(--ease-out) group-hover:scale-100 group-hover:opacity-100 group-hover:delay-150 group-focus-visible:scale-100 group-focus-visible:opacity-100 group-focus-visible:delay-150 motion-reduce:scale-100",
                  NO_DELAY_REDUCED,
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

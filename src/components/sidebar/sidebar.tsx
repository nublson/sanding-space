import Link from "next/link";
import { type ReactNode, ViewTransition } from "react";
import { ShavingMark } from "@/components/brand/shaving-mark";
import type { LibrarySection } from "@/lib/content/types";
import { INTRODUCTION } from "@/lib/introduction";
import { cn } from "@/lib/utils";

// A minimum, not a fixed, height: long titles wrap and grow their row instead
// of overflowing into the next one. One line stays 32px (py-1 + leading-6),
// 28px below md where the type steps down to 14.
const row =
  "flex min-h-8 w-full items-center py-1 leading-6 max-md:min-h-7 max-md:leading-5 pointer-coarse:min-h-11";

export function Sidebar({
  sections,
  introductionCurrent,
  currentSectionSlug,
  currentEssaySlug,
  footer,
}: {
  sections: LibrarySection[];
  introductionCurrent: boolean;
  currentSectionSlug: string | null;
  currentEssaySlug: string | null;
  footer: ReactNode;
}) {
  return (
    <nav
      aria-label="Sections"
      className="flex h-full w-48 flex-col pt-14 md:pt-32"
    >
      {/* Same 32px line box as the page title (SectionHeading), so the two
          rows are built identically and share baseline and cap height in any
          engine. The mark's ink sits ~1px inside its box: -ms-px puts its start
          edge on the text column below, and its ink already spans cap height
          to baseline. */}
      <Link
        href={INTRODUCTION.path}
        className="mb-4 flex h-8 items-center gap-2 text-base leading-8 font-medium text-foreground max-md:hidden"
      >
        <ShavingMark size={20} className="-ms-px" />
        Sanding Space
      </Link>
      {/* Only the list scrolls; the footer stays pinned. Below md the list
          begins under the fixed header and its padding (64px plus the 4px ring
          slack; 8px less on touch, where rows grow from 28 to 44px) puts the
          Introduction on the page title's line at rest, so items can travel up
          to the header and dissolve in the scroll fade. The 1px negative
          margins plus padding keep focus rings from being clipped on desktop. */}
      <div className="scroll-fade -mx-1 -mt-1 min-h-0 flex-1 overflow-y-auto px-1 pt-1 pb-6 max-md:pt-17 max-md:pointer-coarse:pt-[60px]">
        <Link
          href={INTRODUCTION.path}
          data-sound="page"
          aria-current={introductionCurrent ? "page" : undefined}
          className={cn(
            row,
            "mb-4 text-base max-md:text-sm",
            introductionCurrent ? "text-foreground" : "text-subtle-foreground",
          )}
        >
          {INTRODUCTION.name}
        </Link>
        <ul className="flex flex-col">
          {sections.map((section) => {
            const current = section.slug === currentSectionSlug;
            return (
              <li key={section.id}>
                <Link
                  href={`/sections/${section.slug}`}
                  data-sound="page"
                  aria-current={
                    current && !currentEssaySlug ? "page" : undefined
                  }
                  className={cn(
                    row,
                    "text-base max-md:text-sm",
                    current ? "text-foreground" : "text-subtle-foreground",
                  )}
                >
                  {section.name}
                </Link>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200 ease-(--ease-out)",
                    current ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div
                    className="overflow-hidden"
                    inert={!current}
                    aria-hidden={!current}
                  >
                    {current && (
                      <p className="pb-1 text-sm/5 text-subtle-foreground max-md:text-xs/4">
                        {section.question}
                      </p>
                    )}
                    <ul className="border-l border-border">
                      {section.essays.map((essay) => {
                        const active = essay.slug === currentEssaySlug;
                        return (
                          <li key={essay.id}>
                            {essay.status === "Published" ? (
                              <Link
                                href={`/${essay.slug}`}
                                data-sound="page"
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                  row,
                                  "relative ps-3 text-base max-md:text-sm",
                                  active
                                    ? "text-foreground"
                                    : "text-muted-foreground",
                                )}
                              >
                                {active && (
                                  <ViewTransition name="sidebar-marker">
                                    <span
                                      aria-hidden="true"
                                      className="absolute top-1/2 start-[-1.5px] h-3.5 w-0.5 -translate-y-1/2 bg-foreground"
                                    />
                                  </ViewTransition>
                                )}
                                {essay.title}
                              </Link>
                            ) : (
                              <span
                                className={cn(
                                  row,
                                  "ps-3 text-base text-subtle-foreground max-md:text-sm",
                                )}
                              >
                                {essay.title}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="shrink-0 py-3">{footer}</div>
    </nav>
  );
}

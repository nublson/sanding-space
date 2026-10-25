import Link from "next/link";
import { type ReactNode, ViewTransition } from "react";
import { ShavingMark } from "@/components/brand/shaving-mark";
import type { LibrarySection } from "@/lib/content/types";
import { cn } from "@/lib/utils";

const row = "flex h-7 w-full items-center pointer-coarse:h-11";

export function Sidebar({
  sections,
  currentSectionSlug,
  currentEssaySlug,
  footer,
}: {
  sections: LibrarySection[];
  currentSectionSlug: string | null;
  currentEssaySlug: string | null;
  footer: ReactNode;
}) {
  return (
    <nav aria-label="Sections" className="flex h-full w-40 flex-col pt-8">
      <Link
        href="/"
        className="mb-4 flex h-7 items-center gap-2 text-sm font-medium text-foreground pointer-coarse:h-11"
      >
        <ShavingMark size={18} />
        Sanding Space
      </Link>
      <ul className="flex flex-1 flex-col">
        {sections.map((section) => {
          const current = section.slug === currentSectionSlug;
          return (
            <li key={section.id}>
              <Link
                href={`/sections/${section.slug}`}
                data-sound="page"
                aria-current={current && !currentEssaySlug ? "page" : undefined}
                className={cn(
                  row,
                  "text-sm",
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
                    <p className="pb-1 text-xs/4 text-subtle-foreground">
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
                                "relative pl-3 text-sm",
                                active
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              {active && (
                                <ViewTransition name="sidebar-marker">
                                  <span
                                    aria-hidden="true"
                                    className="absolute top-1/2 left-[-1.5px] h-3 w-0.5 -translate-y-1/2 bg-foreground"
                                  />
                                </ViewTransition>
                              )}
                              {essay.title}
                            </Link>
                          ) : (
                            <span
                              className={cn(
                                row,
                                "pl-3 text-sm text-subtle-foreground",
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
      <div className="border-t border-border py-3">{footer}</div>
    </nav>
  );
}

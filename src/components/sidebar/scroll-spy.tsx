"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/sidebar/sidebar";
import type { LibrarySection } from "@/lib/content/types";

type Current = { section: string | null; essay: string | null };

function fromPath(
  pathname: string,
  sections: LibrarySection[],
): Current | null {
  const sectionMatch = /^\/sections\/([^/]+)\/?$/.exec(pathname);
  if (sectionMatch) {
    const slug = decodeURIComponent(sectionMatch[1]);
    return {
      section: sections.some((s) => s.slug === slug) ? slug : null,
      essay: null,
    };
  }
  const essayMatch = /^\/([^/]+)\/?$/.exec(pathname);
  if (essayMatch) {
    const slug = decodeURIComponent(essayMatch[1]);
    const owner = sections.find((s) => s.essays.some((e) => e.slug === slug));
    return owner
      ? { section: owner.slug, essay: slug }
      : { section: null, essay: null };
  }
  return null; // the index: the observer decides
}

/**
 * Owns which sidebar section is expanded. On essay and section pages the URL
 * decides; on the index the section heading nearest the top does.
 */
export function ScrollSpy({
  sections,
  footer,
}: {
  sections: LibrarySection[];
  footer: ReactNode;
}) {
  const pathname = usePathname();
  const fromUrl = useMemo(
    () => fromPath(pathname, sections),
    [pathname, sections],
  );
  const [spied, setSpied] = useState<string | null>(sections[0]?.slug ?? null);
  const onIndex = fromUrl === null;

  useEffect(() => {
    if (!onIndex) return;
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>("[data-section]"),
    );
    if (headings.length === 0) return;
    const order = headings.map((h) => h.dataset.section as string);

    // A band across the top of the viewport. The current section is the last
    // heading at or above the band's bottom edge (the first if none is).
    // Callbacks may be batched, so derive from every heading's latest state.
    const above = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const slug = (entry.target as HTMLElement).dataset.section;
          if (!slug) continue;
          above.set(
            slug,
            entry.isIntersecting ||
              (entry.rootBounds
                ? entry.boundingClientRect.top < entry.rootBounds.bottom
                : false),
          );
        }
        const current = order.findLast((slug) => above.get(slug)) ?? order[0];
        setSpied(current);
      },
      { rootMargin: "0px 0px -70% 0px" },
    );
    for (const heading of headings) observer.observe(heading);
    return () => observer.disconnect();
  }, [onIndex]);

  return (
    <Sidebar
      sections={sections}
      currentSectionSlug={fromUrl ? fromUrl.section : spied}
      currentEssaySlug={fromUrl ? fromUrl.essay : null}
      footer={footer}
    />
  );
}

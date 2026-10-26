"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useMemo } from "react";
import { Sidebar } from "@/components/sidebar/sidebar";
import type { LibrarySection } from "@/lib/content/types";
import { INTRODUCTION } from "@/lib/introduction";

type Current = {
  introduction: boolean;
  section: string | null;
  essay: string | null;
};

function fromPath(pathname: string, sections: LibrarySection[]): Current {
  const none = { introduction: false, section: null, essay: null };
  if (pathname.replace(/\/$/, "") === INTRODUCTION.path)
    return { ...none, introduction: true };
  const sectionMatch = /^\/sections\/([^/]+)\/?$/.exec(pathname);
  if (sectionMatch) {
    const slug = decodeURIComponent(sectionMatch[1]);
    return {
      ...none,
      section: sections.some((s) => s.slug === slug) ? slug : null,
    };
  }
  const essayMatch = /^\/([^/]+)\/?$/.exec(pathname);
  if (essayMatch) {
    const slug = decodeURIComponent(essayMatch[1]);
    const owner = sections.find((s) => s.essays.some((e) => e.slug === slug));
    if (owner) return { ...none, section: owner.slug, essay: slug };
  }
  return none;
}

/** The sidebar with its current page, section and essay read from the URL. */
export function CurrentSidebar({
  sections,
  footer,
}: {
  sections: LibrarySection[];
  footer: ReactNode;
}) {
  const pathname = usePathname();
  const current = useMemo(
    () => fromPath(pathname, sections),
    [pathname, sections],
  );
  return (
    <Sidebar
      sections={sections}
      introductionCurrent={current.introduction}
      currentSectionSlug={current.section}
      currentEssaySlug={current.essay}
      footer={footer}
    />
  );
}

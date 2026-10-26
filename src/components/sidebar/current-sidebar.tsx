"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useMemo } from "react";
import { Sidebar } from "@/components/sidebar/sidebar";
import { RESOURCES } from "@/lib/content/resources";
import type { LibrarySection } from "@/lib/content/types";
import { ABOUT, INTRODUCTION } from "@/lib/standalone";

const FIXED_PAGES = [INTRODUCTION.path, RESOURCES.path, ABOUT.path];

type Current = {
  page: string | null;
  section: string | null;
  essay: string | null;
};

function fromPath(pathname: string, sections: LibrarySection[]): Current {
  const none = { page: null, section: null, essay: null };
  const path = pathname.replace(/\/$/, "");
  if (FIXED_PAGES.includes(path)) return { ...none, page: path };
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
  footerAction,
}: {
  sections: LibrarySection[];
  footerAction: ReactNode;
}) {
  const pathname = usePathname();
  const current = useMemo(
    () => fromPath(pathname, sections),
    [pathname, sections],
  );
  return (
    <Sidebar
      sections={sections}
      currentPagePath={current.page}
      currentSectionSlug={current.section}
      currentEssaySlug={current.essay}
      footerAction={footerAction}
    />
  );
}

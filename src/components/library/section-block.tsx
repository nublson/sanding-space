import type { ReactNode } from "react";
import {
  EssayCard,
  EssayCardSkeleton,
  type TitleLevel,
} from "@/components/library/essay-card";
import {
  type SkeletonLineSpec,
  SkeletonLines,
} from "@/components/skeleton-line";
import { featuredEssay } from "@/lib/content/library";
import type { LibrarySection } from "@/lib/content/types";

/**
 * The title of every top-level page (sections, the Introduction, About). Same
 * type and line box as the sidebar wordmark (16px medium on a 32px line), so
 * the two share baseline, cap height and center across the columns.
 */
export function SectionHeading({
  id,
  level = 2,
  children,
}: {
  id: string;
  level?: 1 | 2 | 3;
  children: ReactNode;
}) {
  const Heading = `h${level}` as const;
  return (
    <Heading
      id={id}
      data-section={id}
      className="text-base leading-8 font-medium text-foreground max-md:text-sm max-md:leading-7"
    >
      {children}
    </Heading>
  );
}

// A typical intro (measured on the live sections): two paragraphs of four
// lines, six and seven on a phone, with the Notion paragraph gap. Phone-only
// lines sit before the short last line, so each paragraph still ends short.
const INTRO: SkeletonLineSpec[][] = [
  [
    { width: "100%" },
    { width: "96%" },
    { width: "98%" },
    { width: "95%", mobile: true },
    { width: "99%", mobile: true },
    { width: "62%" },
  ],
  [
    { width: "100%" },
    { width: "94%" },
    { width: "97%" },
    { width: "98%", mobile: true },
    { width: "93%", mobile: true },
    { width: "96%", mobile: true },
    { width: "71%" },
  ],
];

/**
 * SectionBlock's layout while its data streams in: the title line, the intro,
 * the featured card and one row of the grid, on the same gaps, so the content
 * replaces it without moving.
 */
export function SectionBlockSkeleton() {
  return (
    <div data-skeleton aria-hidden="true" className="flex flex-col gap-6">
      <SkeletonLines
        lines={[{ width: "7rem" }]}
        lineClassName="h-8 max-md:h-7"
      />
      <div className="flex flex-col gap-4">
        {INTRO.map((lines, i) => (
          <SkeletonLines
            // biome-ignore lint/suspicious/noArrayIndexKey: static list
            key={i}
            lines={lines}
            lineClassName="h-[26px] max-md:h-[22px]"
          />
        ))}
      </div>
      <EssayCardSkeleton size="hero" />
      <div className="grid grid-cols-3 gap-x-6 gap-y-8 max-sm:grid-cols-2">
        <EssayCardSkeleton size="card" />
        <EssayCardSkeleton size="card" />
        <div className="max-sm:hidden">
          <EssayCardSkeleton size="card" />
        </div>
      </div>
    </div>
  );
}

export function SectionBlock({
  section,
  intro,
  headingLevel = 2,
}: {
  section: LibrarySection;
  intro: ReactNode;
  headingLevel?: 1 | 2 | 3;
}) {
  const titleLevel = (headingLevel + 1) as TitleLevel;
  const featured = featuredEssay(section);
  const rest = section.essays.filter((e) => e !== featured);

  return (
    <section className="flex flex-col gap-6">
      <SectionHeading id={section.slug} level={headingLevel}>
        {section.name}
      </SectionHeading>
      {intro}
      {featured && (
        <EssayCard essay={featured} size="hero" titleLevel={titleLevel} />
      )}
      <div className="grid grid-cols-3 gap-x-6 gap-y-8 max-sm:grid-cols-2">
        {rest.map((essay) => (
          <EssayCard key={essay.id} essay={essay} titleLevel={titleLevel} />
        ))}
      </div>
    </section>
  );
}

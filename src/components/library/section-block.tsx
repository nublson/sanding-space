import type { ReactNode } from "react";
import { EssayCard, type TitleLevel } from "@/components/library/essay-card";
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
      className="text-base leading-8 font-medium text-foreground"
    >
      {children}
    </Heading>
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

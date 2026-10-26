import Link from "next/link";
import type { ReactNode } from "react";
import { EssayCard } from "@/components/library/essay-card";
import { LiveThumbnail } from "@/components/stage/live-thumbnail";
import { featuredEssay } from "@/lib/content/library";
import type { LibrarySection } from "@/lib/content/types";

/** The heading every section-like page uses (section pages, the Introduction). */
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
      className="font-heading text-[22px] leading-7 tracking-[-0.01em] text-foreground"
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
  const featured = featuredEssay(section);
  const rest = section.essays.filter((e) => e !== featured);

  return (
    <section className="flex flex-col gap-6">
      <SectionHeading id={section.slug} level={headingLevel}>
        {section.name}
      </SectionHeading>
      {intro}
      {featured && (
        <Link
          href={`/${featured.slug}`}
          data-sound="page"
          className="press -m-2 block rounded-[18px] p-2 pointer-fine:hover:bg-card"
        >
          <LiveThumbnail
            demo={featured.coverDemo}
            essaySlug={featured.slug}
            size="hero"
            preview
          />
          <div className="mt-3 px-0.5">
            <h3 className="text-sm font-medium text-foreground">
              {featured.title}
            </h3>
            {featured.summary && (
              <p className="mt-0.5 text-[13px] leading-5 text-subtle-foreground">
                {featured.summary}
              </p>
            )}
          </div>
        </Link>
      )}
      <div className="grid grid-cols-3 gap-x-6 gap-y-8 max-sm:grid-cols-2">
        {rest.map((essay) => (
          <EssayCard key={essay.id} essay={essay} />
        ))}
      </div>
    </section>
  );
}

import Link from "next/link";
import { NotionRenderer } from "notionic";
import { SectionBlock } from "@/components/library/section-block";
import { PageFade } from "@/components/page-fade";
import { firstParagraph, withoutDatabases } from "@/lib/content/blocks";
import { pageHref } from "@/lib/content/links";
import { getBlocks, getLibrary } from "@/lib/content/notion";
import { siteComponents } from "@/lib/content/renderer";
import { demos } from "@/lib/demos";

export default async function IndexPage() {
  const library = await getLibrary();
  const href = pageHref(library);
  const intros = await Promise.all(
    library.sections.map(async (section) =>
      firstParagraph(withoutDatabases(await getBlocks(section.id))),
    ),
  );

  return (
    <PageFade>
      <div className="article-layout flex flex-col gap-12 md:gap-14">
        {library.sections.map((section, i) => (
          <div
            key={section.id}
            className="border-border not-first:border-t not-first:pt-14"
          >
            <SectionBlock
              section={section}
              intro={
                <div className="text-pretty text-muted-foreground">
                  <NotionRenderer
                    blocks={intros[i]}
                    demos={demos}
                    pageHref={href}
                    components={siteComponents}
                  />
                  <Link
                    href={`/sections/${section.slug}`}
                    data-sound="page"
                    className="link mt-2 inline-flex items-center gap-1 text-[13px]"
                  >
                    Read more <span className="nudge-out">↗</span>
                  </Link>
                </div>
              }
            />
          </div>
        ))}
      </div>
    </PageFade>
  );
}

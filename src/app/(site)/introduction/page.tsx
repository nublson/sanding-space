import type { Metadata } from "next";
import { NotionRenderer } from "notionic";
import { SectionHeading } from "@/components/library/section-block";
import { PageFade } from "@/components/page-fade";
import { withoutDatabases } from "@/lib/content/blocks";
import { pageHref } from "@/lib/content/links";
import { getBlocks, getLibrary } from "@/lib/content/notion";
import { siteComponents } from "@/lib/content/renderer";
import { demos } from "@/lib/demos";
import { INTRODUCTION } from "@/lib/introduction";
import { title } from "@/lib/site";

// Static route: Next matches it before the (site)/[slug] essay route.
export const metadata: Metadata = {
  title: { absolute: title(INTRODUCTION.name) },
};

// Laid out like a section page: the heading, then the Notion content below.
export default async function IntroductionPage() {
  const [library, blocks] = await Promise.all([
    getLibrary(),
    getBlocks(INTRODUCTION.pageId),
  ]);

  return (
    <PageFade>
      <div className="article-layout">
        <section className="flex flex-col gap-6">
          <SectionHeading id="introduction" level={1}>
            {INTRODUCTION.name}
          </SectionHeading>
          <div className="text-pretty text-muted-foreground">
            <NotionRenderer
              blocks={withoutDatabases(blocks)}
              demos={demos}
              pageHref={pageHref(library)}
              components={siteComponents}
            />
          </div>
        </section>
      </div>
    </PageFade>
  );
}

import type { Metadata } from "next";
import { NotionRenderer } from "notionic";
import { SectionHeading } from "@/components/library/section-block";
import { PageFade } from "@/components/page-fade";
import { withoutDatabases } from "@/lib/content/blocks";
import { pageHref } from "@/lib/content/links";
import { getIntroduction, getLibrary } from "@/lib/content/notion";
import { siteComponents } from "@/lib/content/renderer";
import { demos } from "@/lib/demos";
import { INTRODUCTION } from "@/lib/introduction";
import { pageMetadata } from "@/lib/site";

// Static route: Next matches it before the (site)/[slug] essay route. The
// sidebar label and path are fixed; the title is the Notion page's own.
export async function generateMetadata(): Promise<Metadata> {
  const { title } = await getIntroduction();
  return pageMetadata({ name: title, path: INTRODUCTION.path });
}

// Laid out like a section page: the Notion title as the heading, then the body.
export default async function IntroductionPage() {
  const [library, { title, blocks }] = await Promise.all([
    getLibrary(),
    getIntroduction(),
  ]);

  return (
    <PageFade>
      <div className="article-layout">
        <section className="flex flex-col gap-6">
          <SectionHeading id="introduction" level={1}>
            {title}
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

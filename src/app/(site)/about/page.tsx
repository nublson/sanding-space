import type { Metadata } from "next";
import { NotionRenderer } from "notionic";
import { SectionHeading } from "@/components/library/section-block";
import { PageFade } from "@/components/page-fade";
import { withoutDatabases } from "@/lib/content/blocks";
import { pageHref } from "@/lib/content/links";
import { getAbout, getLibrary } from "@/lib/content/notion";
import { siteComponents } from "@/lib/content/renderer";
import { demos } from "@/lib/demos";
import { pageMetadata } from "@/lib/site";
import { ABOUT } from "@/lib/standalone";

// Static route: Next matches it before the (site)/[slug] essay route. The
// colophon: the sidebar label and path are fixed, the page is Notion's.
export async function generateMetadata(): Promise<Metadata> {
  const { title } = await getAbout();
  return pageMetadata({ name: title, path: ABOUT.path, ownImage: true });
}

export default async function AboutPage() {
  const [library, { title, blocks }] = await Promise.all([
    getLibrary(),
    getAbout(),
  ]);

  return (
    <PageFade>
      <article className="article-layout flex flex-col gap-6">
        <SectionHeading id="about" level={1}>
          {title}
        </SectionHeading>
        <div className="text-pretty text-muted-foreground">
          <NotionRenderer
            blocks={withoutDatabases(blocks)}
            demos={demos}
            pageHref={pageHref(library)}
            components={siteComponents}
            linkFavicons
          />
        </div>
      </article>
    </PageFade>
  );
}

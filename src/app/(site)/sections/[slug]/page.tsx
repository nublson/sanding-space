import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotionRenderer } from "notionic";
import { SectionBlock } from "@/components/library/section-block";
import { PageFade } from "@/components/page-fade";
import { withoutDatabases } from "@/lib/content/blocks";
import { pageHref } from "@/lib/content/links";
import { getBlocks, getLibrary } from "@/lib/content/notion";
import { siteComponents } from "@/lib/content/renderer";
import { demos } from "@/lib/demos";
import { title } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const library = await getLibrary();
  const params = library.sections.map((section) => ({ slug: section.slug }));
  // cacheComponents rejects an empty list; the sentinel resolves to notFound().
  return params.length > 0 ? params : [{ slug: "__none" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const library = await getLibrary();
  const section = library.sections.find((s) => s.slug === slug);
  if (!section) return { title: { absolute: title("Not found") } };
  return {
    title: { absolute: title(section.name) },
    description: section.question || undefined,
  };
}

export default async function SectionPage({ params }: Props) {
  const { slug } = await params;
  const library = await getLibrary();
  const section = library.sections.find((s) => s.slug === slug);
  if (!section) notFound();
  const blocks = withoutDatabases(await getBlocks(section.id));

  return (
    <PageFade>
      <div className="article-layout">
        <SectionBlock
          section={section}
          headingLevel={1}
          intro={
            <div className="text-pretty text-muted-foreground">
              <NotionRenderer
                blocks={blocks}
                demos={demos}
                pageHref={pageHref(library)}
                components={siteComponents}
              />
            </div>
          }
        />
      </div>
    </PageFade>
  );
}

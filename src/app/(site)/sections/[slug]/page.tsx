import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { NotionRenderer } from "notionic";
import { Suspense } from "react";
import {
  SectionBlock,
  SectionBlockSkeleton,
} from "@/components/library/section-block";
import { PageFade } from "@/components/page-fade";
import { withoutDatabases } from "@/lib/content/blocks";
import { pageHref } from "@/lib/content/links";
import { getBlocks, getLibrary } from "@/lib/content/notion";
import { siteComponents } from "@/lib/content/renderer";
import { demos } from "@/lib/demos";
import { pageMetadata, title } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const library = await getLibrary();
  const params = library.sections.map((section) => ({ slug: section.slug }));
  // cacheComponents rejects an empty list; the sentinel resolves to notFound().
  return params.length > 0 ? params : [{ slug: "__none" }];
}

// Runtime data (params) is read here and passed in; the data work is cached
// per slug, so metadata joins the prerendered shell instead of deferring.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return sectionMetadata(slug);
}

async function sectionMetadata(slug: string): Promise<Metadata> {
  "use cache";
  cacheTag("notion");
  cacheLife("minutes");
  const library = await getLibrary();
  const section = library.sections.find((s) => s.slug === slug);
  if (!section) return { title: { absolute: title("Not found") } };
  return pageMetadata({
    name: section.name,
    description: section.question || undefined,
    path: `/sections/${section.slug}`,
    ownImage: true,
  });
}

// The page itself reads no URL data, so its shell is instant on navigation;
// everything that depends on the slug streams into the skeleton below.
export default function SectionPage({ params }: Props) {
  return (
    <PageFade>
      <Suspense fallback={<SectionBlockSkeleton />}>
        <SectionContent params={params} />
      </Suspense>
    </PageFade>
  );
}

async function SectionContent({ params }: Props) {
  const { slug } = await params;
  const library = await getLibrary();
  const section = library.sections.find((s) => s.slug === slug);
  if (!section) notFound();
  const blocks = withoutDatabases(await getBlocks(section.id));

  return (
    <div data-stream className="article-layout">
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
  );
}

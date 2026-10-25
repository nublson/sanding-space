import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NotionRenderer } from "notionic";
import { PageFade } from "@/components/page-fade";
import { SiteDemoFrame } from "@/components/stage/demo-frame";
import { LiveThumbnail } from "@/components/stage/live-thumbnail";
import { findPublishedEssay } from "@/lib/content/library";
import { pageHref } from "@/lib/content/links";
import { getBlocks, getLibrary } from "@/lib/content/notion";
import { demos } from "@/lib/demos";
import { SITE_URL, title } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

const components = {
  demo: SiteDemoFrame,
  child_database: () => null,
  unsupported: () => null,
};

export async function generateStaticParams() {
  const library = await getLibrary();
  return Array.from(library.bySlug.values())
    .filter(({ essay }) => essay.status === "Published")
    .map(({ essay }) => ({ slug: essay.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = findPublishedEssay(await getLibrary(), slug);
  if (!entry) return {};
  const url = `${SITE_URL}/${entry.essay.slug}`;
  return {
    title: { absolute: title(entry.essay.title) },
    description: entry.essay.summary || undefined,
    alternates: {
      types: {
        "application/json+oembed": `${SITE_URL}/api/oembed?url=${encodeURIComponent(url)}&format=json`,
      },
    },
  };
}

export default async function EssayPage({ params }: Props) {
  const { slug } = await params;
  const library = await getLibrary();
  const entry = findPublishedEssay(library, slug);
  if (!entry) notFound();
  const { essay, section } = entry;
  const blocks = await getBlocks(essay.id);

  return (
    <PageFade>
      <article className="article-layout flex flex-col gap-12">
        <header className="flex flex-col gap-3">
          <Link
            href={`/sections/${section.slug}`}
            data-sound="page"
            className="link w-fit text-[13px] leading-5"
          >
            {section.name}
          </Link>
          <h1 className="font-heading text-balance text-[32px]/[38px] tracking-[-0.015em] text-foreground">
            {essay.title}
          </h1>
          {essay.summary && (
            <p className="text-pretty text-muted-foreground">{essay.summary}</p>
          )}
        </header>
        <div className="max-sm:-mx-4">
          <LiveThumbnail
            demo={essay.coverDemo}
            essaySlug={essay.slug}
            size="hero"
          />
        </div>
        <div className="border-t border-border pt-12 text-pretty text-muted-foreground">
          <NotionRenderer
            blocks={blocks}
            demos={demos}
            pageHref={pageHref(library)}
            components={components}
          />
        </div>
      </article>
    </PageFade>
  );
}

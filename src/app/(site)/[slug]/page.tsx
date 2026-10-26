import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NotionRenderer } from "notionic";
import { Suspense } from "react";
import { PageFade } from "@/components/page-fade";
import { DemoStage } from "@/components/stage/demo-stage";
import { LiveThumbnail } from "@/components/stage/live-thumbnail";
import { findPublishedEssay } from "@/lib/content/library";
import { pageHref } from "@/lib/content/links";
import { getBlocks, getLibrary } from "@/lib/content/notion";
import { siteComponents } from "@/lib/content/renderer";
import { demos } from "@/lib/demos";
import { SITE_URL, title } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const library = await getLibrary();
  const params = Array.from(library.bySlug.values())
    .filter(({ essay }) => essay.status === "Published")
    .map(({ essay }) => ({ slug: essay.slug }));
  // cacheComponents rejects an empty list; the sentinel resolves to notFound().
  return params.length > 0 ? params : [{ slug: "__none" }];
}

// Runtime data (params) is read here and passed in; the data work is cached
// per slug, so metadata joins the prerendered shell instead of deferring.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return essayMetadata(slug);
}

async function essayMetadata(slug: string): Promise<Metadata> {
  "use cache";
  cacheTag("notion");
  cacheLife("minutes");
  const entry = findPublishedEssay(await getLibrary(), slug);
  // The not-found boundary renders under this route, so its title lives here.
  if (!entry) return { title: { absolute: title("Not found") } };
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

// The page itself reads no URL data, so its shell is instant on navigation;
// everything that depends on the slug streams into the skeleton below.
export default function EssayPage({ params }: Props) {
  return (
    <PageFade>
      <Suspense fallback={<EssaySkeleton />}>
        <EssayContent params={params} />
      </Suspense>
    </PageFade>
  );
}

async function EssayContent({ params }: Props) {
  const { slug } = await params;
  const library = await getLibrary();
  const entry = findPublishedEssay(library, slug);
  if (!entry) notFound();
  const { essay, section } = entry;
  const blocks = await getBlocks(essay.id);

  return (
    <article data-stream className="article-layout flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <Link
          href={`/sections/${section.slug}`}
          data-sound="page"
          className="link w-fit text-[13px] leading-5 underline decoration-from-font underline-offset-4"
        >
          {section.name}
        </Link>
        <h1 className="font-heading text-balance text-[32px]/[38px] tracking-[-0.015em] text-foreground">
          {essay.title}
        </h1>
        {essay.summary && (
          <p className="measure text-pretty text-muted-foreground">
            {essay.summary}
          </p>
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
          components={siteComponents}
        />
      </div>
    </article>
  );
}

// Same bones as the essay header and stage. Static, no shimmer (spec §11.5);
// the content fades over it once it streams in.
function EssaySkeleton() {
  return (
    <div data-skeleton aria-hidden="true" className="flex flex-col gap-12">
      <div className="flex flex-col gap-3">
        <div className="h-5" />
        <div className="h-[38px]" />
      </div>
      <div className="max-sm:-mx-4">
        <DemoStage size="hero" />
      </div>
    </div>
  );
}

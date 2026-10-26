import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NotionRenderer } from "notionic";
import { Suspense } from "react";
import { PageFade } from "@/components/page-fade";
import { JsonLd } from "@/components/seo/json-ld";
import { DemoStage } from "@/components/stage/demo-stage";
import { LiveThumbnail } from "@/components/stage/live-thumbnail";
import { findPublishedEssay } from "@/lib/content/library";
import { pageHref } from "@/lib/content/links";
import { getBlocks, getLibrary } from "@/lib/content/notion";
import { siteComponents } from "@/lib/content/renderer";
import { demos } from "@/lib/demos";
import {
  AUTHOR,
  absoluteUrl,
  pageMetadata,
  SITE_NAME,
  SITE_URL,
  title,
} from "@/lib/site";

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
  const { essay, section } = entry;
  const url = `${SITE_URL}/${essay.slug}`;
  const base = pageMetadata({
    name: essay.title,
    description: essay.summary || undefined,
    path: `/${essay.slug}`,
    ownImage: true,
    type: "article",
    article: {
      publishedTime: essay.published,
      modifiedTime: essay.updated,
      tags: essay.tags,
      section: section.name,
    },
  });
  return {
    ...base,
    alternates: {
      ...base.alternates,
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
  const url = absoluteUrl(`/${essay.slug}`);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: essay.title,
    description: essay.summary || undefined,
    image: `${url}/opengraph-image`,
    url,
    mainEntityOfPage: url,
    datePublished: essay.published ?? undefined,
    dateModified: essay.updated,
    articleSection: section.name,
    keywords: essay.tags.length ? essay.tags : undefined,
    author: { "@type": "Person", name: AUTHOR.name, url: AUTHOR.url },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: section.name,
        item: absoluteUrl(`/sections/${section.slug}`),
      },
      { "@type": "ListItem", position: 2, name: essay.title, item: url },
    ],
  };

  return (
    <article data-stream className="article-layout flex flex-col gap-12">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <header className="flex flex-col gap-3">
        <Link
          href={`/sections/${section.slug}`}
          data-sound="page"
          className="link w-fit text-sm/5 underline decoration-from-font underline-offset-4 max-md:text-[13px]"
        >
          {section.name}
        </Link>
        <h1 className="font-heading text-balance text-[32px]/[38px] tracking-[-0.015em] text-foreground max-md:text-[28px]/[34px]">
          {essay.title}
        </h1>
        {essay.summary && (
          <p className="text-lg/7 text-pretty text-muted-foreground max-md:text-base/[26px]">
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
          linkFavicons
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

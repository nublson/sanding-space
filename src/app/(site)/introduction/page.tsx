import type { Metadata } from "next";
import { NotionRenderer } from "notionic";
import { PageFade } from "@/components/page-fade";
import { withoutDatabases } from "@/lib/content/blocks";
import { pageHref } from "@/lib/content/links";
import { getLibrary, getPage } from "@/lib/content/notion";
import { siteComponents } from "@/lib/content/renderer";
import { demos } from "@/lib/demos";
import { INTRODUCTION } from "@/lib/introduction";
import { title } from "@/lib/site";

// Static route: Next matches it before the (site)/[slug] essay route.
export const metadata: Metadata = {
  title: { absolute: title(INTRODUCTION.name) },
};

export default async function IntroductionPage() {
  const [library, { page, blocks }] = await Promise.all([
    getLibrary(),
    getPage(INTRODUCTION.pageId),
  ]);

  return (
    <PageFade>
      <article className="article-layout flex flex-col gap-12">
        <header className="flex flex-col gap-3">
          <p className="text-[13px] leading-5 text-subtle-foreground">
            {INTRODUCTION.name}
          </p>
          <h1 className="font-heading text-balance text-[32px]/[38px] tracking-[-0.015em] text-foreground">
            {page.title || INTRODUCTION.name}
          </h1>
        </header>
        <div className="text-pretty text-muted-foreground">
          <NotionRenderer
            blocks={withoutDatabases(blocks)}
            demos={demos}
            pageHref={pageHref(library)}
            components={siteComponents}
          />
        </div>
      </article>
    </PageFade>
  );
}

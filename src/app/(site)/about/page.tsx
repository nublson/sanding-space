import type { Metadata } from "next";
import { PageFade } from "@/components/page-fade";
import { title } from "@/lib/site";

// Static route: Next matches it before the (site)/[slug] essay route.
export const metadata: Metadata = {
  title: { absolute: title("About") },
};

export default function AboutPage() {
  return (
    <PageFade>
      <article className="article-layout flex flex-col gap-6">
        <h1 className="font-heading text-balance text-[32px]/[38px] tracking-[-0.015em] text-foreground">
          About
        </h1>
        <p className="text-pretty text-muted-foreground">
          Sanding Space is a library of short essays about design engineering
          and product engineering. Every essay contains live, interactive demos,
          and every demo has its own permanent URL, so it can be embedded
          anywhere on the web.
        </p>
      </article>
    </PageFade>
  );
}

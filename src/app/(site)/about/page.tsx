import type { Metadata } from "next";
import { SectionHeading } from "@/components/library/section-block";
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
        <SectionHeading id="about" level={1}>
          About
        </SectionHeading>
        <p className="measure text-pretty text-muted-foreground">
          Sanding Space is a library of short essays about design engineering
          and product engineering. Every essay contains live, interactive demos,
          and every demo has its own permanent URL, so it can be embedded
          anywhere on the web.
        </p>
      </article>
    </PageFade>
  );
}

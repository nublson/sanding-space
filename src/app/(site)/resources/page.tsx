import type { Metadata } from "next";
import { ResourceList } from "@/components/library/resource-list";
import { SectionHeading } from "@/components/library/section-block";
import { PageFade } from "@/components/page-fade";
import { getResources } from "@/lib/content/notion";
import { RESOURCES } from "@/lib/content/resources";
import { pageMetadata } from "@/lib/site";

// Static route: Next matches it before the (site)/[slug] essay route. Laid
// out like a section page: the heading, the one-line intro, then the
// categories. Label and path are fixed; everything else is the database's.
export async function generateMetadata(): Promise<Metadata> {
  const { intro } = await getResources();
  return pageMetadata({
    name: RESOURCES.name,
    description: intro || undefined,
    path: RESOURCES.path,
  });
}

export default async function ResourcesPage() {
  const { intro, categories } = await getResources();

  return (
    <PageFade>
      <div className="article-layout flex flex-col gap-6">
        <SectionHeading id="resources" level={1}>
          {RESOURCES.name}
        </SectionHeading>
        {intro && <p className="text-pretty text-muted-foreground">{intro}</p>}
        <ResourceList categories={categories} />
      </div>
    </PageFade>
  );
}

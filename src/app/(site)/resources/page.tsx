import type { Metadata } from "next";
import { ResourceList } from "@/components/library/resource-list";
import { SectionHeading } from "@/components/library/section-block";
import { PageFade } from "@/components/page-fade";
import { PLACEHOLDER_RESOURCES, RESOURCES } from "@/lib/content/resources";
import { pageMetadata } from "@/lib/site";

// Static route: Next matches it before the (site)/[slug] essay route. Laid
// out like a section page: the heading, the one-line intro, then the
// categories. Layout scaffold: the data is a placeholder until the Notion
// data layer reads the Resources database.
export async function generateMetadata(): Promise<Metadata> {
  const { intro } = PLACEHOLDER_RESOURCES;
  return pageMetadata({
    name: RESOURCES.name,
    description: intro,
    path: RESOURCES.path,
  });
}

export default async function ResourcesPage() {
  const { intro, categories } = PLACEHOLDER_RESOURCES;

  return (
    <PageFade>
      <div className="article-layout flex flex-col gap-6">
        <SectionHeading id="resources" level={1}>
          {RESOURCES.name}
        </SectionHeading>
        <p className="text-pretty text-muted-foreground">{intro}</p>
        <ResourceList categories={categories} />
      </div>
    </PageFade>
  );
}

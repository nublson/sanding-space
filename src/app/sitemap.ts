import type { MetadataRoute } from "next";
import { getAbout, getIntroduction, getLibrary } from "@/lib/content/notion";
import type { Library } from "@/lib/content/types";
import { demoMeta } from "@/lib/demo-meta";
import { INTRODUCTION } from "@/lib/introduction";
import { absoluteUrl } from "@/lib/site";

/** Every indexable URL: the fixed pages, visible sections, Published essays and live demos. */
export function sitemapEntries(
  library: Library,
  demos: Record<string, { retired?: boolean }> = demoMeta,
  introductionUpdated?: string,
  aboutUpdated?: string,
): MetadataRoute.Sitemap {
  const essays = library.sections.flatMap((section) =>
    section.essays
      .filter((essay) => essay.status === "Published")
      .map((essay) => ({ essay, section })),
  );
  const latest = (dates: string[]) =>
    dates.length ? new Date(dates.sort().at(-1) as string) : undefined;

  return [
    {
      url: absoluteUrl(INTRODUCTION.path),
      lastModified: introductionUpdated
        ? new Date(introductionUpdated)
        : undefined,
      priority: 1,
      changeFrequency: "weekly",
    },
    {
      url: absoluteUrl("/about"),
      lastModified: aboutUpdated ? new Date(aboutUpdated) : undefined,
      priority: 0.3,
      changeFrequency: "yearly",
    },
    ...library.sections.map((section) => ({
      url: absoluteUrl(`/sections/${section.slug}`),
      lastModified: latest(
        section.essays
          .filter((e) => e.status === "Published")
          .map((e) => e.updated),
      ),
      priority: 0.7,
      changeFrequency: "weekly" as const,
    })),
    ...essays.map(({ essay }) => ({
      url: absoluteUrl(`/${essay.slug}`),
      lastModified: new Date(essay.updated),
      priority: 0.8,
      changeFrequency: "monthly" as const,
    })),
    ...Object.entries(demos)
      .filter(([, meta]) => !meta.retired)
      .map(([name]) => ({
        url: absoluteUrl(`/demos/${name}`),
        priority: 0.5,
        changeFrequency: "monthly" as const,
      })),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [library, introduction, about] = await Promise.all([
    getLibrary(),
    getIntroduction(),
    getAbout(),
  ]);
  return sitemapEntries(
    library,
    demoMeta,
    introduction.lastEditedTime,
    about.lastEditedTime,
  );
}

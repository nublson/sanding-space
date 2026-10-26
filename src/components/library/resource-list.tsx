import { SectionHeading } from "@/components/library/section-block";
import type { Resource, ResourceCategory } from "@/lib/content/types";
import { faviconUrl, hostOf } from "@/lib/favicon";

/**
 * The Resources page body: each category under its own heading, its
 * resources as one row each. A row is the destination's favicon, its name
 * and a one-line description, the whole row being the link so it is one
 * target. Every resource is external: a new tab, with the favicon saying
 * where it goes (same convention as links in essays).
 */
export function ResourceList({
  categories,
}: {
  categories: ResourceCategory[];
}) {
  return (
    <div className="flex flex-col gap-10">
      {categories.map((category) => (
        <section
          key={category.id}
          aria-labelledby={`resources-${category.id}`}
          className="flex flex-col gap-2"
        >
          <SectionHeading id={`resources-${category.id}`} level={2}>
            {category.name}
          </SectionHeading>
          <ul className="flex flex-col">
            {category.resources.map((resource) => (
              <li key={resource.id}>
                <ResourceRow resource={resource} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ResourceRow({ resource }: { resource: Resource }) {
  const host = hostOf(resource.url);
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      data-sound="tap"
      className="press -mx-2 flex min-h-10 items-start gap-3 rounded-lg px-2 py-2 pointer-fine:hover:bg-card pointer-coarse:min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {/* A 20px box centered on the first line (24px, 20px below md). */}
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center max-md:mt-0">
        {host && (
          // biome-ignore lint/performance/noImgElement: a 16px icon from our own proxy; next/image adds nothing here
          <img
            src={faviconUrl(host)}
            alt=""
            width={16}
            height={16}
            loading="lazy"
            decoding="async"
            className="size-4 rounded-[3px]"
          />
        )}
      </span>
      <span className="text-base/6 text-subtle-foreground max-md:text-sm/5">
        <span className="font-medium text-foreground">{resource.name}</span>
        {/* Real spaces around the dot, so the accessible name reads
            "Name Description" and the dot is only visual. */}
        {resource.description && (
          <>
            {" "}
            <span aria-hidden="true" className="mx-1">
              ·
            </span>{" "}
            {resource.description}
          </>
        )}{" "}
        <span className="sr-only">(opens in a new tab)</span>
      </span>
    </a>
  );
}

import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { ShavingMark } from "@/components/brand/shaving-mark";
import { ResizeReporter } from "@/components/embed/resize-reporter";
import { demos, registry, resolveDemo } from "@/lib/demos";
import { splitParams } from "@/lib/frame-params";
import { SITE_URL, title } from "@/lib/site";
import { cn } from "@/lib/utils";

type Search = Record<string, string | string[] | undefined>;
type Props = { params: Promise<{ name: string }> };

export function generateStaticParams() {
  return Object.keys(registry).map((name) => ({ name }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const resolved = resolveDemo(name);
  if (resolved.kind !== "demo") return {};
  return {
    title: { absolute: title(resolved.entry.title) },
    alternates: {
      canonical: `${SITE_URL}/demos/${name}`,
      types: {
        "application/json+oembed": `${SITE_URL}/api/oembed?url=${encodeURIComponent(`${SITE_URL}/demos/${name}`)}&format=json`,
      },
    },
  };
}

function queryString(search: Search): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) qs.append(key, v);
  }
  return qs.toString();
}

export async function DemoFrame({
  name,
  searchParams,
}: {
  name: string;
  searchParams: Promise<Search>;
}) {
  const resolved = resolveDemo(name);
  if (resolved.kind === "missing") notFound();
  const search = await searchParams;
  if (resolved.kind === "alias") {
    const query = queryString(search);
    permanentRedirect(`/demos/${resolved.target}${query ? `?${query}` : ""}`);
  }
  if (resolved.kind !== "demo") notFound();
  const { entry } = resolved;
  const { frame, params } = splitParams(search);
  const Demo = demos[name];

  return (
    <div
      className={cn(
        "flex min-h-dvh items-center justify-center",
        frame.theme === "light" ? "light" : "dark",
        frame.theme === "system" && "theme-system",
        frame.bg === "default" && "bg-background text-foreground",
      )}
    >
      <ResizeReporter name={name}>
        <Demo name={name} params={params} />
      </ResizeReporter>
      {frame.chrome && (
        <a
          href={`/${entry.essay}`}
          target="_blank"
          rel="noopener"
          className="fixed right-3 bottom-3 flex items-center gap-1 text-xs text-subtle-foreground"
        >
          <ShavingMark size={12} />
          Sanding Space ↗
        </a>
      )}
    </div>
  );
}

export default async function DemoPage({
  params,
  searchParams,
}: Props & { searchParams: Promise<Search> }) {
  const { name } = await params;
  if (resolveDemo(name).kind === "missing") notFound();
  return (
    <Suspense fallback={null}>
      <DemoFrame name={name} searchParams={searchParams} />
    </Suspense>
  );
}

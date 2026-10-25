import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShavingMark } from "@/components/brand/shaving-mark";
import { ResizeReporter } from "@/components/embed/resize-reporter";
import { resolveDemo } from "@/lib/demo-meta";
import { demos, registry } from "@/lib/demos";
import { type FrameParams, splitParams } from "@/lib/frame-params";
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

const DEFAULT_FRAME: FrameParams = {
  theme: "system",
  bg: "default",
  chrome: true,
};

export function Frame({
  name,
  frame,
  params,
}: {
  name: string;
  frame: FrameParams;
  params: Record<string, string>;
}) {
  const resolved = resolveDemo(name);
  if (resolved.kind !== "demo") notFound();
  const { entry } = resolved;
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

export async function DemoFrame({
  name,
  searchParams,
}: {
  name: string;
  searchParams: Promise<Search>;
}) {
  const { frame, params } = splitParams(await searchParams);
  return <Frame name={name} frame={frame} params={params} />;
}

// Alias names are redirected (308) by next.config.ts before reaching this page.
export default async function DemoPage({
  params,
  searchParams,
}: Props & { searchParams: Promise<Search> }) {
  const { name } = await params;
  if (resolveDemo(name).kind !== "demo") notFound();
  return (
    <Suspense
      fallback={<Frame name={name} frame={DEFAULT_FRAME} params={{}} />}
    >
      <DemoFrame name={name} searchParams={searchParams} />
    </Suspense>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ResizeReporter } from "@/components/embed/resize-reporter";
import { resolveDemo } from "@/lib/demo-meta";
import { demos, registry } from "@/lib/demos";
import { type FrameParams, splitParams } from "@/lib/frame-params";
import { SITE_URL, title } from "@/lib/site";
import { cn } from "@/lib/utils";

type Search = Record<string, string | string[] | undefined>;
type Props = { params: Promise<{ name: string }> };

// An empty list fails the build under Cache Components; the placeholder
// renders notFound().
export function generateStaticParams() {
  const names = Object.keys(registry);
  return names.length ? names.map((name) => ({ name })) : [{ name: "__none" }];
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

// The prerendered shell can't see the query string.
const FALLBACK_FRAME: FrameParams = {
  theme: "system",
  bg: "default",
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
      {/* The measured root is never shorter than the registry height, so
          embed.js keeps the stage size; taller content grows it. */}
      <ResizeReporter
        name={name}
        minHeight={entry.height}
        className="flex w-full"
      >
        <div className="flex w-full flex-1 items-center justify-center">
          <Demo name={name} params={params} />
        </div>
      </ResizeReporter>
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

// Reads the name inside the outer boundary, so the route shell never waits on
// params. Every registered name is prerendered, so the shell normally holds
// the demo already; only an unknown name resolves late, to notFound().
async function NamedDemo({
  params,
  searchParams,
}: Props & { searchParams: Promise<Search> }) {
  const { name } = await params;
  if (resolveDemo(name).kind !== "demo") notFound();
  return (
    <Suspense
      fallback={<Frame name={name} frame={FALLBACK_FRAME} params={{}} />}
    >
      <DemoFrame name={name} searchParams={searchParams} />
    </Suspense>
  );
}

// Alias names are redirected (308) by next.config.ts before reaching this page.
export default function DemoPage(
  props: Props & { searchParams: Promise<Search> },
) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <NamedDemo {...props} />
    </Suspense>
  );
}

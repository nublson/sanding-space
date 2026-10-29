export type DemoMeta = {
  title: string;
  /** One line for link previews and listings; `demoDescription` fills in a default. */
  description?: string;
  /** The essay that explains this demo. Optional: a demo can ship before its essay. */
  essay?: string;
  height: number;
  aliases?: string[];
  retired?: boolean;
};

const DEFAULT_DESCRIPTION =
  "A live, interactive demo. Try it here, then embed it anywhere on the web.";
const RETIRED_DESCRIPTION =
  "This demo has moved. Its page links to where it lives now.";

/** The one line that describes a demo wherever it is listed or previewed. */
export function demoDescription(entry: DemoMeta): string {
  if (entry.retired) return RETIRED_DESCRIPTION;
  return entry.description ?? DEFAULT_DESCRIPTION;
}

// Names are permanent: rename with `aliases`, retire with `retired`. Each entry
// also needs a loader in src/components/demos/lazy-demo.tsx.
export const demoMeta: Record<string, DemoMeta> = {
  "sanded-form": {
    title: "Sanded Form",
    description: "Two forms that look the same. Fill in both, keyboard first.",
    essay: "sand-the-back",
    height: 600,
  },
  "search-expand": { title: "Search Expand", height: 280 },
  surface: { title: "Surface", height: 420 },
};

export type ResolvedDemo<T extends DemoMeta = DemoMeta> =
  | { kind: "demo"; name: string; entry: T }
  | { kind: "alias"; target: string }
  | { kind: "missing" };

export function resolveDemoIn<T extends DemoMeta>(
  source: Record<string, T>,
  name: string,
): ResolvedDemo<T> {
  if (Object.hasOwn(source, name))
    return { kind: "demo", name, entry: source[name] };
  for (const [target, entry] of Object.entries(source)) {
    if (entry.aliases?.includes(name)) return { kind: "alias", target };
  }
  return { kind: "missing" };
}

export function resolveDemo(name: string): ResolvedDemo {
  return resolveDemoIn(demoMeta, name);
}

export function aliasRedirects(
  meta: Record<string, DemoMeta> = demoMeta,
): { source: string; destination: string; permanent: true }[] {
  return Object.entries(meta).flatMap(([name, m]) =>
    (m.aliases ?? []).map((alias) => ({
      source: `/demos/${alias}`,
      destination: `/demos/${name}`,
      permanent: true as const,
    })),
  );
}

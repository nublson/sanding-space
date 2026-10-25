export type DemoMeta = {
  title: string;
  essay: string;
  height: number;
  aliases?: string[];
  retired?: boolean;
};

export const demoMeta: Record<string, DemoMeta> = {
  "button-press-scale": {
    title: "Button press, scale",
    essay: "button-press",
    height: 320,
  },
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

import type { DemoProps } from "notionic";
import type { DemoMeta } from "@/lib/demo-meta";

// The production registry can be empty, so tests that need a real demo mock
// the registry modules with this one:
//   vi.mock("@/lib/demo-meta", async (orig) =>
//     (await import("@/test/fake-demos")).mockDemoMeta(orig));
//   vi.mock("@/components/demos/lazy-demo", async () =>
//     (await import("@/test/fake-demos")).mockLazyDemo());

export const fakeDemoMeta: Record<string, DemoMeta> = {
  "test-demo": {
    title: "Test demo",
    essay: "test-essay",
    height: 320,
    aliases: ["old-name"],
  },
  "essayless-demo": { title: "Essayless demo", height: 200 },
};

export function FakeDemo({ params }: DemoProps) {
  return (
    <button type="button" data-params={JSON.stringify(params)}>
      Press and hold
    </button>
  );
}

export async function mockDemoMeta(
  orig: () => Promise<typeof import("@/lib/demo-meta")>,
) {
  const real = await orig();
  return {
    ...real,
    demoMeta: fakeDemoMeta,
    resolveDemo: (name: string) => real.resolveDemoIn(fakeDemoMeta, name),
    aliasRedirects: (meta = fakeDemoMeta) => real.aliasRedirects(meta),
  };
}

export async function mockLazyDemo() {
  return {
    lazyDemoNames: Object.keys(fakeDemoMeta),
    LazyDemo: (props: DemoProps) =>
      Object.hasOwn(fakeDemoMeta, props.name) ? <FakeDemo {...props} /> : null,
  };
}

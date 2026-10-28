import { render, screen } from "@testing-library/react";
import DemoPage, { DemoFrame } from "@/app/demos/[name]/page";

const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("next/navigation", () => ({ notFound }));

vi.mock("@/lib/demo-meta", async (orig) =>
  (await import("@/test/fake-demos")).mockDemoMeta(orig),
);
vi.mock("@/components/demos/lazy-demo", async () =>
  (await import("@/test/fake-demos")).mockLazyDemo(),
);

const props = (name: string) => ({
  params: Promise.resolve({ name }),
  searchParams: Promise.resolve({}),
});
const frame = async (name: string, search: Record<string, string> = {}) =>
  render(await DemoFrame({ name, searchParams: Promise.resolve(search) }));

describe("demo page", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows no attribution mark, so the embed is the demo alone", async () => {
    await frame("test-demo");
    expect(screen.queryByText(/Sanding Space/)).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("still keeps an old chrome=0 out of the demo's params", async () => {
    await frame("test-demo", { chrome: "0", x: "1" });
    expect(screen.getByRole("button")).toHaveAttribute(
      "data-params",
      JSON.stringify({ x: "1" }),
    );
  });

  it("applies the theme class", async () => {
    const { container } = await frame("test-demo", { theme: "light" });
    expect(container.firstElementChild).toHaveClass("light");
    const sys = await frame("test-demo");
    expect(sys.container.firstElementChild).toHaveClass("dark", "theme-system");
  });

  // The page wraps NamedDemo in a Suspense boundary; NamedDemo reads the
  // name and nests the frame's own boundary.
  const named = async (name: string) => {
    const page = DemoPage(props(name)) as {
      props: { children: React.ReactElement<Record<string, unknown>> };
    };
    const Inner = page.props.children.type as (
      p: Record<string, unknown>,
    ) => Promise<{ props: { fallback: React.ReactElement } }>;
    return Inner(page.props.children.props);
  };

  it("reads the name inside Suspense, behind a plain shell", () => {
    const page = DemoPage(props("test-demo")) as {
      props: { fallback: React.ReactElement };
    };
    const { container } = render(page.props.fallback);
    expect(container.firstElementChild).toHaveClass("min-h-dvh");
    expect(container.textContent).toBe("");
  });

  it("calls notFound for unknown names", async () => {
    await expect(named("nope")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("prerenders the frame without the mark in the Suspense fallback", async () => {
    const el = await named("test-demo");
    render(el.props.fallback);
    expect(await screen.findByText("Press and hold")).toBeInTheDocument();
    expect(screen.queryByText(/Sanding Space/)).toBeNull();
  });

  it("gives the measured root the registry height as min-height", async () => {
    const { container } = await frame("test-demo");
    const root = container.querySelector("[data-resize-root]");
    expect(root).toHaveStyle({ minHeight: "320px" });
  });
});

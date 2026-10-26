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

  it("links the attribution home when the demo has no essay yet", async () => {
    await frame("essayless-demo");
    expect(screen.getByRole("link", { name: /Sanding Space/ })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("shows an attribution link to the essay that opens in a new tab", async () => {
    await frame("test-demo");
    const link = screen.getByRole("link", { name: /Sanding Space/ });
    expect(link).toHaveAttribute("href", "/test-essay");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
  });

  it("hides the attribution with chrome=0", async () => {
    await frame("test-demo", { chrome: "0" });
    expect(screen.queryByText(/Sanding Space/)).toBeNull();
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
    // The attribution lives inside the measured area, after the stage.
    const link = screen.getByRole("link", { name: /Sanding Space/ });
    expect(root).toContainElement(link);
    expect(link).not.toHaveClass("fixed");
  });
});

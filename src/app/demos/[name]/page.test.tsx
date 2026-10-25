import { render, screen } from "@testing-library/react";
import DemoPage, { DemoFrame } from "@/app/demos/[name]/page";

const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("next/navigation", () => ({ notFound }));

const props = (name: string) => ({
  params: Promise.resolve({ name }),
  searchParams: Promise.resolve({}),
});
const frame = async (name: string, search: Record<string, string> = {}) =>
  render(await DemoFrame({ name, searchParams: Promise.resolve(search) }));

describe("demo page", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows an attribution link to the essay that opens in a new tab", async () => {
    await frame("button-press-scale");
    const link = screen.getByRole("link", { name: /Sanding Space/ });
    expect(link).toHaveAttribute("href", "/button-press");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
  });

  it("hides the attribution with chrome=0", async () => {
    await frame("button-press-scale", { chrome: "0" });
    expect(screen.queryByText(/Sanding Space/)).toBeNull();
  });

  it("applies the theme class", async () => {
    const { container } = await frame("button-press-scale", { theme: "light" });
    expect(container.firstElementChild).toHaveClass("light");
    const sys = await frame("button-press-scale");
    expect(sys.container.firstElementChild).toHaveClass("dark", "theme-system");
  });

  it("calls notFound for unknown names", async () => {
    await expect(DemoPage(props("nope"))).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("prerenders the frame without the mark in the Suspense fallback", async () => {
    const el = (await DemoPage(props("button-press-scale"))) as {
      props: { fallback: React.ReactElement };
    };
    render(el.props.fallback);
    expect(await screen.findByText("Press and hold")).toBeInTheDocument();
    expect(screen.queryByText(/Sanding Space/)).toBeNull();
  });

  it("gives the measured root the registry height as min-height", async () => {
    const { container } = await frame("button-press-scale");
    const root = container.querySelector("[data-resize-root]");
    expect(root).toHaveStyle({ minHeight: "320px" });
    // The attribution lives inside the measured area, after the stage.
    const link = screen.getByRole("link", { name: /Sanding Space/ });
    expect(root).toContainElement(link);
    expect(link).not.toHaveClass("fixed");
  });
});

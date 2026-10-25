import { render, screen } from "@testing-library/react";
import DemoPage, { DemoFrame } from "@/app/demos/[name]/page";

const { notFound, permanentRedirect } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  permanentRedirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
vi.mock("next/navigation", () => ({ notFound, permanentRedirect }));
vi.mock("@/lib/demos", async (orig) => {
  const mod = await orig<typeof import("@/lib/demos")>();
  return {
    ...mod,
    resolveDemo: (name: string) =>
      name === "old-name"
        ? { kind: "alias", target: "button-press-scale" }
        : mod.resolveDemo(name),
  };
});

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

  it("redirects aliases permanently, preserving the query", async () => {
    await expect(
      DemoFrame({
        name: "old-name",
        searchParams: Promise.resolve({ theme: "light", x: ["1", "2"] }),
      }),
    ).rejects.toThrow("REDIRECT:/demos/button-press-scale?theme=light&x=1&x=2");
    await expect(
      DemoFrame({ name: "old-name", searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("REDIRECT:/demos/button-press-scale");
  });
});

import { getLibrary } from "@/lib/content/notion";
import { generateStaticParams } from "./page";

vi.mock("@/lib/content/notion", () => ({
  getLibrary: vi.fn(),
  getBlocks: vi.fn(),
}));

const lib = (get: unknown) =>
  vi.mocked(getLibrary).mockResolvedValue(get as never);

describe("essay generateStaticParams", () => {
  it("returns one sentinel when nothing is published", async () => {
    lib({ sections: [], bySlug: new Map() });
    expect(await generateStaticParams()).toEqual([{ slug: "__none" }]);
  });

  it("returns only real slugs otherwise", async () => {
    const essay = { slug: "button-press", status: "Published" };
    const soon = { slug: "later", status: "Soon" };
    const section = { slug: "interaction", essays: [essay, soon] };
    lib({
      sections: [section],
      bySlug: new Map([
        ["button-press", { essay, section }],
        ["later", { essay: soon, section }],
      ]),
    });
    expect(await generateStaticParams()).toEqual([{ slug: "button-press" }]);
  });
});

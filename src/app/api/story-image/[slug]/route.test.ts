import { getLibrary } from "@/lib/content/notion";
import { ogImage } from "@/lib/og/image";
import { GET } from "./route";

vi.mock("@/lib/content/notion", () => ({ getLibrary: vi.fn() }));
vi.mock("@/lib/og/image", () => ({
  ogImage: vi.fn(async () => new Response("png")),
}));

function library(summary: string) {
  const essay = {
    slug: "sand-the-back",
    title: "Sand the Back",
    summary,
    status: "Published",
  };
  const section = { name: "Principles", essays: [essay] };
  vi.mocked(getLibrary).mockResolvedValue({
    sections: [section],
    bySlug: new Map([["sand-the-back", { essay, section }]]),
  } as never);
}

const request = (slug: string) =>
  GET(new Request(`https://sanding.space/api/story-image/${slug}`), {
    params: Promise.resolve({ slug }),
  });

describe("GET /api/story-image/[slug]", () => {
  beforeEach(() => vi.mocked(ogImage).mockClear());

  it("draws the essay's summary under its title", async () => {
    library("Why the parts nobody asks for are the parts people feel.");
    await request("sand-the-back");
    expect(ogImage).toHaveBeenCalledWith({
      eyebrow: "Principles",
      title: "Sand the Back",
      description: "Why the parts nobody asks for are the parts people feel.",
      format: "story",
    });
  });

  it("leaves the description out when the essay has no summary", async () => {
    library("");
    await request("sand-the-back");
    expect(vi.mocked(ogImage).mock.calls[0][0]).not.toHaveProperty(
      "description",
    );
  });

  it("is a 404 for an unknown essay", async () => {
    library("x");
    expect((await request("nope")).status).toBe(404);
    expect(ogImage).not.toHaveBeenCalled();
  });
});

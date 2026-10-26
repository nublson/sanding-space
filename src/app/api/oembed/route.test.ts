import { getLibrary } from "@/lib/content/notion";
import { SITE_URL } from "@/lib/site";
import { GET } from "./route";

vi.mock("@/lib/content/notion", () => ({ getLibrary: vi.fn() }));

vi.mock("@/lib/demo-meta", async (orig) =>
  (await import("@/test/fake-demos")).mockDemoMeta(orig),
);
vi.mock("@/components/demos/lazy-demo", async () =>
  (await import("@/test/fake-demos")).mockLazyDemo(),
);

const get = (url: string) =>
  GET(
    new Request(
      `${SITE_URL}/api/oembed?url=${encodeURIComponent(url)}&format=json`,
    ),
  );

describe("GET /api/oembed", () => {
  beforeEach(() => {
    vi.mocked(getLibrary).mockRejectedValue(new Error("Missing env"));
  });

  it("serves demo urls without touching Notion", async () => {
    const res = await get(`${SITE_URL}/demos/test-demo`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      type: "rich",
      title: "Test demo",
    });
    expect(getLibrary).not.toHaveBeenCalled();
  });

  it("returns 503 for essay urls when Notion is unavailable", async () => {
    const res = await get(`${SITE_URL}/button-press`);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: expect.any(String),
    });
  });

  it("returns 404 for unknown demos and 400 without a url", async () => {
    expect((await get(`${SITE_URL}/demos/nope`)).status).toBe(404);
    expect((await GET(new Request(`${SITE_URL}/api/oembed`))).status).toBe(400);
  });
});

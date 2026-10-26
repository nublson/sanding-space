import nextConfig from "../../next.config";

describe("frame headers", () => {
  it("allows framing demos anywhere and everything else only by self", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const find = (source: string) => rules.find((r) => r.source === source);
    expect(find("/demos/:path*")?.headers).toEqual([
      { key: "Content-Security-Policy", value: "frame-ancestors *" },
    ]);
    expect(find("/((?!demos/).*)")?.headers).toEqual([
      { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
    ]);
    for (const r of rules)
      for (const h of r.headers)
        expect(h.key.toLowerCase()).not.toBe("x-frame-options");
  });
});

test("the home page redirects to the introduction, temporarily", async () => {
  const redirects = (await nextConfig.redirects?.()) ?? [];
  expect(redirects).toContainEqual({
    source: "/",
    destination: "/introduction",
    permanent: false,
  });
});

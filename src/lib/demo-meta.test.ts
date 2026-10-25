import { aliasRedirects } from "./demo-meta";

describe("aliasRedirects", () => {
  it("maps each alias to its demo as a permanent redirect", () => {
    expect(
      aliasRedirects({
        current: {
          title: "C",
          essay: "e",
          height: 1,
          aliases: ["old", "older"],
        },
        other: { title: "O", essay: "e", height: 1 },
      }),
    ).toEqual([
      { source: "/demos/old", destination: "/demos/current", permanent: true },
      {
        source: "/demos/older",
        destination: "/demos/current",
        permanent: true,
      },
    ]);
  });
  it("is empty when there are no aliases", () => {
    expect(aliasRedirects()).toEqual([]);
  });
});

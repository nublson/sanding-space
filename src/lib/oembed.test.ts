import { buildLibrary } from "./content/library";
import type { Essay, Section } from "./content/types";
import type { DemoMeta } from "./demo-meta";
import { buildOembed } from "./oembed";

const siteUrl = "https://sanding.space";
const demos: Record<string, DemoMeta> = {
  "button-press-scale": {
    title: "Button press, scale",
    essay: "button-press",
    height: 320,
    aliases: ["old-press"],
  },
};
const section: Section = {
  id: "s1",
  slug: "interaction",
  name: "Interaction",
  question: "q",
  order: 1,
  visible: true,
};
const essay = (o: Partial<Essay>): Essay => ({
  id: o.slug ?? "e",
  slug: "e",
  title: "T",
  summary: "",
  status: "Published",
  order: 1,
  sectionId: "s1",
  coverDemo: null,
  tags: [],
  published: null,
  updated: "2026-01-01",
  relatedIds: [],
  ...o,
});
const library = buildLibrary(
  [section],
  [
    essay({
      slug: "button-press",
      title: "Button press",
      coverDemo: "button-press-scale",
    }),
    essay({ slug: "plain", title: "Plain essay" }),
    essay({ slug: "later", title: "Later", status: "Soon" }),
  ],
);
const ctx = { siteUrl, demos, library };

describe("buildOembed", () => {
  it("returns a rich embed for a demo url", () => {
    expect(
      buildOembed({ url: `${siteUrl}/demos/button-press-scale` }, ctx),
    ).toEqual({
      version: "1.0",
      type: "rich",
      provider_name: "Sanding Space",
      provider_url: siteUrl,
      title: "Button press, scale",
      width: 640,
      height: 320,
      html:
        `<iframe src="${siteUrl}/demos/button-press-scale"\n` +
        `  data-sanding loading="lazy" style="width:100%;height:320px;border:0"\n` +
        `  title="Button press, scale · Sanding Space"></iframe>\n` +
        `<script async src="${siteUrl}/embed.js"></script>`,
    });
  });

  it("clamps width and height downward only", () => {
    const small = buildOembed(
      {
        url: `${siteUrl}/demos/button-press-scale`,
        maxwidth: 400,
        maxheight: 200,
      },
      ctx,
    );
    expect(small).toMatchObject({ width: 400, height: 200 });
    expect((small as { html: string }).html).toContain("height:200px");
    const big = buildOembed(
      {
        url: `${siteUrl}/demos/button-press-scale`,
        maxwidth: 2000,
        maxheight: 2000,
      },
      ctx,
    );
    expect(big).toMatchObject({ width: 640, height: 320 });
  });

  it("resolves alias urls, trailing slashes and query strings", () => {
    expect(
      buildOembed({ url: `${siteUrl}/demos/old-press/?theme=dark` }, ctx),
    ).toMatchObject({ type: "rich", title: "Button press, scale" });
  });

  it("embeds the cover demo for a published essay with the essay title", () => {
    const r = buildOembed({ url: `${siteUrl}/button-press` }, ctx);
    expect(r).toMatchObject({
      type: "rich",
      title: "Button press",
      width: 640,
      height: 320,
    });
    expect((r as { html: string }).html).toContain(
      `${siteUrl}/demos/button-press-scale`,
    );
  });

  it("returns a link for an essay without a cover", () => {
    expect(buildOembed({ url: `${siteUrl}/plain` }, ctx)).toEqual({
      version: "1.0",
      type: "link",
      title: "Plain essay",
      provider_name: "Sanding Space",
      provider_url: siteUrl,
    });
  });

  it("returns null for other origins, Soon essays, unknown paths and bad urls", () => {
    expect(buildOembed({ url: "https://evil.example/plain" }, ctx)).toBeNull();
    expect(buildOembed({ url: `${siteUrl}/later` }, ctx)).toBeNull();
    expect(buildOembed({ url: `${siteUrl}/nope` }, ctx)).toBeNull();
    expect(buildOembed({ url: `${siteUrl}/demos/nope` }, ctx)).toBeNull();
    expect(buildOembed({ url: "not a url" }, ctx)).toBeNull();
    expect(buildOembed({ url: `${siteUrl}/demos/%E0%A4%A` }, ctx)).toBeNull();
  });
});

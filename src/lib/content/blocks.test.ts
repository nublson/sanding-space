import type { NotionBlock } from "notionic";
import { demoEmbeds, firstParagraph, withoutDatabases } from "./blocks";

const b = (o: Record<string, unknown>) => o as unknown as NotionBlock;
const text = (t: string) => (t ? [{ plain_text: t }] : []);
const para = (t: string) =>
  b({ type: "paragraph", paragraph: { rich_text: text(t) } });
const heading = (t: string) =>
  b({ type: "heading_2", heading_2: { rich_text: text(t) } });
const embed = (url: string) =>
  b({ type: "embed", embed: { url, caption: [] } });

describe("firstParagraph", () => {
  it("skips an empty paragraph and a heading", () => {
    const first = para("Hello");
    expect(
      firstParagraph([heading("H"), para(""), first, para("Two")]),
    ).toEqual([first]);
  });
  it("returns [] when there is none", () => {
    expect(firstParagraph([heading("H")])).toEqual([]);
  });
});

describe("withoutDatabases", () => {
  it("removes child_database, database links and unsupported blocks", () => {
    const keep = para("x");
    const out = withoutDatabases([
      keep,
      b({ type: "child_database", child_database: { title: "Essays" } }),
      b({ type: "link_to_page", link_to_page: { type: "database_id" } }),
      b({ type: "unsupported" }),
      b({ type: "link_to_page", link_to_page: { type: "page_id" } }),
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]).toBe(keep);
  });
});

describe("demoEmbeds", () => {
  it("finds demos in nested children and ignores look-alikes", () => {
    const blocks = [
      b({
        type: "toggle",
        toggle: { rich_text: [] },
        children: [embed("https://sanding.space/demos/button-press-scale?x=1")],
      }),
      embed("https://example.com/demos-x"),
    ];
    expect(demoEmbeds(blocks)).toEqual(["button-press-scale"]);
  });
});

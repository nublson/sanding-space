import { describe, expect, it } from "vitest";
import {
  type AnnouncementItem,
  announcementItems,
  essayAnnouncement,
  isLive,
  promotionAnnouncement,
} from "./announcement";
import { buildLibrary } from "./library";
import type { Essay, Promotion, Section } from "./types";

const section = (o: Partial<Section> = {}): Section => ({
  id: "s1",
  slug: "interaction",
  name: "Interaction",
  question: "?",
  order: 1,
  visible: true,
  ...o,
});
const essay = (o: Partial<Essay> = {}): Essay => ({
  id: "e1",
  slug: "e1",
  title: "E",
  summary: "",
  status: "Published",
  order: 1,
  sectionId: "s1",
  coverDemo: null,
  apply: null,
  tags: [],
  published: null,
  updated: "2026-01-01T00:00:00.000Z",
  relatedIds: [],
  ...o,
});
const promo = (o: Partial<Promotion> = {}): Promotion => ({
  id: "p1",
  name: "Interfaces",
  description: "A magazine.",
  url: "https://interfaces.example",
  active: true,
  start: null,
  end: null,
  tag: null,
  favicon: null,
  ...o,
});

describe("essayAnnouncement", () => {
  // Preview needs no case here: getLibrary has already resolved it to
  // Published or Soon (resolvePreview, tested in library.test.ts).
  it("picks the latest Published essay with a date", () => {
    const lib = buildLibrary(
      [section()],
      [
        essay({ id: "a", slug: "a", published: "2026-10-01" }),
        essay({ id: "b", slug: "b", published: "2026-11-01", order: 2 }),
      ],
    );
    expect(essayAnnouncement(lib)?.id).toBe("b");
  });

  it("ignores Soon essays and essays without a date", () => {
    const lib = buildLibrary(
      [section()],
      [
        essay({ id: "a", slug: "a", published: "2026-10-01" }),
        essay({ id: "s", slug: "s", status: "Soon", published: "2026-11-05" }),
        essay({ id: "n", slug: "n", published: null }),
      ],
    );
    expect(essayAnnouncement(lib)?.id).toBe("a");
  });

  it("breaks ties by section order, then essay order", () => {
    const lib = buildLibrary(
      [
        section({ id: "s1", order: 2 }),
        section({ id: "s2", slug: "motion", order: 1 }),
      ],
      [
        essay({ id: "x", slug: "x", sectionId: "s1", published: "2026-11-01" }),
        essay({
          id: "y",
          slug: "y",
          sectionId: "s2",
          order: 2,
          published: "2026-11-01",
        }),
        essay({
          id: "z",
          slug: "z",
          sectionId: "s2",
          order: 1,
          published: "2026-11-01",
        }),
      ],
    );
    expect(essayAnnouncement(lib)?.id).toBe("z");
  });

  it("returns null for an empty library", () => {
    expect(essayAnnouncement(buildLibrary([], []))).toBeNull();
  });

  it("builds the essay item", () => {
    const lib = buildLibrary(
      [section()],
      [essay({ published: "2026-11-01", title: "T", summary: "S" })],
    );
    expect(essayAnnouncement(lib)).toEqual({
      kind: "essay",
      id: "e1",
      title: "T",
      summary: "S",
      href: "/e1",
      label: "New essay",
      tag: null,
      icon: null,
      startsAt: null,
      expiresAt: "2026-11-15T00:00:00.000Z",
    });
  });
});

describe("promotionAnnouncement", () => {
  it("builds the promotion item", () => {
    expect(
      promotionAnnouncement(
        promo({
          start: "2026-11-10",
          end: "2026-11-20",
          favicon: "data:x",
          tag: "New",
        }),
      ),
    ).toEqual({
      kind: "external",
      id: "p1",
      title: "Interfaces",
      summary: "A magazine.",
      href: "https://interfaces.example",
      label: null,
      tag: "New",
      icon: "data:x",
      startsAt: "2026-11-10T00:00:00.000Z",
      expiresAt: "2026-11-21T00:00:00.000Z",
    });
  });

  it("never gives a promo a label: its title and description speak for it", () => {
    expect(promotionAnnouncement(promo()).label).toBeNull();
  });

  it("leaves missing dates open", () => {
    const item = promotionAnnouncement(promo());
    expect(item.startsAt).toBeNull();
    expect(item.expiresAt).toBeNull();
  });
});

describe("announcementItems", () => {
  it("lists promotions first, then the essay", () => {
    const lib = buildLibrary([section()], [essay({ published: "2026-11-01" })]);
    const items = announcementItems(lib, [promo(), promo({ id: "p2" })]);
    expect(items.map((i) => i.id)).toEqual(["p1", "p2", "e1"]);
  });
});

describe("isLive", () => {
  const base: AnnouncementItem = {
    kind: "external",
    id: "x",
    title: "",
    summary: "",
    href: "",
    label: "",
    tag: null,
    icon: null,
    startsAt: null,
    expiresAt: null,
  };
  const at = (iso: string) => Date.parse(iso);

  it("is live until the moment it expires", () => {
    const item = { ...base, expiresAt: "2026-11-15T00:00:00.000Z" };
    expect(isLive(item, at("2026-11-14T23:59:59Z"))).toBe(true);
    expect(isLive(item, at("2026-11-15T00:00:00Z"))).toBe(false);
  });

  it("is live from the moment it starts", () => {
    const item = { ...base, startsAt: "2026-11-10T00:00:00.000Z" };
    expect(isLive(item, at("2026-11-09T23:59:59Z"))).toBe(false);
    expect(isLive(item, at("2026-11-10T00:00:00Z"))).toBe(true);
  });

  it("is always live with no dates", () => {
    expect(isLive(base, at("2030-01-01T00:00:00Z"))).toBe(true);
  });
});

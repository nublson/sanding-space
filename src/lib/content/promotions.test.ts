import { describe, expect, it } from "vitest";
import { selectPromotions } from "./promotions";
import type { Promotion } from "./types";

const promo = (o: Partial<Promotion> = {}): Promotion => ({
  id: "p",
  name: "Interfaces",
  description: "",
  url: "https://interfaces.example",
  label: null,
  active: true,
  start: null,
  end: null,
  favicon: null,
  ...o,
});

describe("selectPromotions", () => {
  it("drops inactive rows and rows without a name or URL", () => {
    const rows = [
      promo({ id: "ok" }),
      promo({ id: "off", active: false }),
      promo({ id: "noname", name: "" }),
      promo({ id: "nourl", url: "" }),
    ];
    expect(selectPromotions(rows).map((p) => p.id)).toEqual(["ok"]);
  });

  it("drops rows whose URL is not an absolute web address", () => {
    const rows = [
      promo({ id: "ok" }),
      promo({ id: "bare", url: "interfaces.dev" }),
      promo({ id: "mail", url: "mailto:hi@interfaces.dev" }),
    ];
    expect(selectPromotions(rows).map((p) => p.id)).toEqual(["ok"]);
  });

  it("sorts by Start, latest first, empty Start last", () => {
    const rows = [
      promo({ id: "a", start: "2026-11-01" }),
      promo({ id: "b", start: null }),
      promo({ id: "c", start: "2026-11-05" }),
    ];
    expect(selectPromotions(rows).map((p) => p.id)).toEqual(["c", "a", "b"]);
  });

  it("breaks ties by name", () => {
    const rows = [
      promo({ id: "z", name: "Zine", start: "2026-11-01" }),
      promo({ id: "a", name: "Atlas", start: "2026-11-01" }),
    ];
    expect(selectPromotions(rows).map((p) => p.id)).toEqual(["a", "z"]);
  });
});

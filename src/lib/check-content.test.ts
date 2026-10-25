import { describe, expect, it } from "vitest";
import { checkContent } from "./check-content";
import type { Essay, Section } from "./content/types";
import type { DemoMeta } from "./demo-meta";

const section = (o: Partial<Section> = {}): Section => ({
  id: "s1",
  slug: "motion",
  name: "Motion",
  question: "",
  order: 1,
  visible: true,
  ...o,
});
const essay = (o: Partial<Essay> = {}): Essay => ({
  id: "e1",
  slug: "button-press",
  title: "Button Press",
  summary: "",
  status: "Published",
  order: 1,
  sectionId: "s1",
  coverDemo: null,
  tags: [],
  published: null,
  updated: "",
  relatedIds: [],
  ...o,
});
const demo = (o: Partial<DemoMeta> = {}): DemoMeta => ({
  title: "Demo",
  essay: "button-press",
  height: 300,
  ...o,
});

type Input = Parameters<typeof checkContent>[0];
const base = (o: Partial<Input> = {}): Input => ({
  sections: [section()],
  essays: [essay()],
  embedsByEssay: { e1: ["press"] },
  demos: { press: demo() },
  ...o,
});

describe("checkContent", () => {
  it("passes a valid input", () => {
    expect(checkContent(base())).toEqual({ errors: [], warnings: [] });
  });

  it("1: errors on unregistered embed in non-Draft essay", () => {
    const r = checkContent(base({ embedsByEssay: { e1: ["nope"] } }));
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toContain("button-press");
    expect(r.errors[0]).toContain("nope");
  });
  it("1: ignores Draft essays", () => {
    const r = checkContent(
      base({
        essays: [essay({ status: "Draft" })],
        embedsByEssay: { e1: ["nope"] },
        demos: { press: demo({ essay: "other" }) },
      }),
    );
    expect(r.errors.filter((e) => e.includes("nope"))).toEqual([]);
  });
  it("1: accepts alias names", () => {
    const r = checkContent(
      base({
        embedsByEssay: { e1: ["old"] },
        demos: { press: demo({ aliases: ["old"] }) },
      }),
    );
    expect(r.errors).toEqual([]);
  });

  it("2: errors on unknown cover demo", () => {
    const r = checkContent(base({ essays: [essay({ coverDemo: "nope" })] }));
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toContain("nope");
  });
  it("2: ignores unknown cover demos on Soon and Draft essays", () => {
    const r = checkContent(
      base({
        essays: [
          essay({ id: "s", slug: "s", status: "Soon", coverDemo: "nope" }),
          essay({ id: "d", slug: "d", status: "Draft", coverDemo: "nope" }),
        ],
        embedsByEssay: {},
      }),
    );
    expect(r.errors.filter((e) => e.includes("rule 2"))).toEqual([]);
  });
  it("2: errors on unknown cover demo for Preview essays", () => {
    const r = checkContent(
      base({ essays: [essay({ status: "Preview", coverDemo: "nope" })] }),
    );
    expect(r.errors.some((e) => e.includes("rule 2"))).toBe(true);
  });
  it("2: accepts alias cover demo", () => {
    const r = checkContent(
      base({
        essays: [essay({ coverDemo: "old" })],
        demos: { press: demo({ aliases: ["old"] }) },
      }),
    );
    expect(r.errors).toEqual([]);
  });

  it("3: errors on duplicate essay slug", () => {
    const r = checkContent(
      base({ essays: [essay(), essay({ id: "e2" })], embedsByEssay: {} }),
    );
    expect(r.errors.some((e) => e.includes("button-press"))).toBe(true);
  });
  it("3: errors on reserved slug", () => {
    const r = checkContent(
      base({
        essays: [essay({ slug: "api" })],
        demos: { press: demo({ essay: "api" }) },
      }),
    );
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toContain("api");
  });
  it("3: errors on blank slug of non-Draft essay", () => {
    const r = checkContent(
      base({
        essays: [essay({ slug: "", title: "Untitled One" })],
        demos: {},
        embedsByEssay: {},
      }),
    );
    expect(r.errors.some((e) => e.includes("Untitled One"))).toBe(true);
  });

  it("4: errors on duplicate section slug", () => {
    const r = checkContent(
      base({ sections: [section(), section({ id: "s2" })] }),
    );
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toContain("motion");
  });

  it("5: errors on null or unknown section", () => {
    for (const sectionId of [null, "zzz"]) {
      const r = checkContent(base({ essays: [essay({ sectionId })] }));
      expect(r.errors).toHaveLength(1);
      expect(r.errors[0]).toContain("button-press");
    }
  });

  it("6: errors when a demo name equals another demo's alias", () => {
    const r = checkContent(
      base({
        demos: { press: demo(), other: demo({ aliases: ["press"] }) },
      }),
    );
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toContain("press");
  });

  it("7: errors when essay slug is missing or Draft", () => {
    const missing = checkContent(
      base({ demos: { press: demo({ essay: "ghost" }) } }),
    );
    expect(missing.errors).toHaveLength(1);
    const draft = checkContent(
      base({
        essays: [essay({ status: "Draft" })],
        embedsByEssay: {},
      }),
    );
    expect(draft.errors).toHaveLength(1);
  });
  it("7: warns only when essay is Preview", () => {
    const r = checkContent(
      base({ essays: [essay({ status: "Preview" })], embedsByEssay: {} }),
    );
    expect(r.errors).toEqual([]);
    expect(r.warnings).toHaveLength(1);
  });
  it("7: warns only when essay is Soon", () => {
    const r = checkContent(
      base({ essays: [essay({ status: "Soon" })], embedsByEssay: {} }),
    );
    expect(r.errors).toEqual([]);
    expect(r.warnings).toHaveLength(1);
  });
});

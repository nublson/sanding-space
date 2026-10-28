import { describe, expect, it } from "vitest";
import { readChoice, readNumber } from "./params";

const range = { min: 0.5, max: 1 };

describe("readNumber", () => {
  it("falls back for non-numeric, empty and missing values", () => {
    expect(readNumber({ a: "abc" }, "a", 0.9, range)).toBe(0.9);
    expect(readNumber({ a: "" }, "a", 0.9, range)).toBe(0.9);
    expect(readNumber({}, "a", 0.9, range)).toBe(0.9);
  });
  it("clamps to the range", () => {
    expect(readNumber({ a: "-4" }, "a", 0.9, range)).toBe(0.5);
    expect(readNumber({ a: "7" }, "a", 0.9, range)).toBe(1);
  });
  it("reads in-range values", () => {
    expect(readNumber({ a: "450" }, "a", 400, { min: 50, max: 1000 })).toBe(
      450,
    );
  });
});

describe("readChoice", () => {
  const choices = ["off", "on"] as const;
  it("is undefined when the key is absent", () => {
    expect(readChoice({}, "guides", choices, "off")).toBeUndefined();
  });
  it("reads a listed value", () => {
    expect(readChoice({ guides: "on" }, "guides", choices, "off")).toBe("on");
    expect(readChoice({ guides: "off" }, "guides", choices, "off")).toBe("off");
  });
  it("falls back for unlisted and empty values", () => {
    expect(readChoice({ guides: "yes" }, "guides", choices, "off")).toBe("off");
    expect(readChoice({ guides: "" }, "guides", choices, "off")).toBe("off");
  });
});

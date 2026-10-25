import { describe, expect, it } from "vitest";
import { readNumber } from "./params";

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

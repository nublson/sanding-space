import { describe, expect, it } from "vitest";
import { splitParams } from "./frame-params";

describe("splitParams", () => {
  it("separates frame params from demo params", () => {
    expect(
      splitParams({
        stiffness: "500",
        theme: "light",
        chrome: "0",
        bg: "transparent",
      }),
    ).toEqual({
      frame: { theme: "light", bg: "transparent" },
      params: { stiffness: "500" },
    });
  });
  it("applies defaults and rejects invalid values", () => {
    expect(splitParams({ theme: "blue", bg: "red" })).toEqual({
      frame: { theme: "system", bg: "default" },
      params: {},
    });
  });
  it("takes the first value of arrays and skips undefined", () => {
    const { frame, params } = splitParams({
      theme: ["dark", "light"],
      x: ["1", "2"],
      y: undefined,
    });
    expect(frame.theme).toBe("dark");
    expect(params).toEqual({ x: "1" });
  });
});

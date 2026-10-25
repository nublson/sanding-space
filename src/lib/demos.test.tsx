import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  type DemoEntry,
  deriveDemos,
  registry,
  resolveDemo,
  resolveDemoIn,
} from "./demos";

const Stub = () => <div>stub</div>;
const testRegistry: Record<string, DemoEntry> = {
  current: {
    component: Stub,
    title: "Current",
    essay: "e",
    height: 100,
    aliases: ["old"],
  },
  gone: {
    component: Stub,
    title: "Gone",
    essay: "some-essay",
    height: 100,
    retired: true,
  },
};

describe("resolveDemo", () => {
  it("resolves the real button-press-scale demo", () => {
    const r = resolveDemo("button-press-scale");
    expect(r.kind).toBe("demo");
    if (r.kind === "demo") {
      expect(r.entry.essay).toBe("button-press");
      expect(r.entry.height).toBe(320);
      expect(r.entry.title).toBe("Button press, scale");
    }
  });
  it("returns missing for unknown names", () => {
    expect(resolveDemo("nope")).toEqual({ kind: "missing" });
  });
  it("resolves aliases to their target", () => {
    expect(resolveDemoIn(testRegistry, "old")).toEqual({
      kind: "alias",
      target: "current",
    });
    expect(resolveDemoIn(testRegistry, "current").kind).toBe("demo");
  });
  it("does not resolve inherited object keys", () => {
    expect(resolveDemoIn(testRegistry, "constructor")).toEqual({
      kind: "missing",
    });
  });
});

describe("deriveDemos", () => {
  it("maps live entries to their component and retired ones to RetiredDemo", () => {
    const map = deriveDemos(testRegistry);
    expect(map.current).toBe(Stub);
    const Retired = map.gone;
    render(<Retired name="gone" params={{}} />);
    expect(screen.getByText("This demo has moved")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/some-essay");
  });
  it("derives the real registry", () => {
    expect(Object.keys(deriveDemos(registry))).toContain("button-press-scale");
  });
});

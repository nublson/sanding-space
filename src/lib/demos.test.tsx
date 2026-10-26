import { render, screen } from "@testing-library/react";
import type { DemoProps } from "notionic";
import { describe, expect, it } from "vitest";
import { lazyDemoNames } from "@/components/demos/lazy-demo";
import { demoMeta } from "./demo-meta";
import {
  type DemoEntry,
  demoComponents,
  deriveDemos,
  registry,
  resolveDemo,
  resolveDemoIn,
  withoutFrameParams,
} from "./demos";

const Stub = ({ name, params }: DemoProps) => (
  <div>
    stub:{name}:{JSON.stringify(params)}
  </div>
);
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
  it("resolves every registered demo by name", () => {
    for (const name of Object.keys(demoMeta))
      expect(resolveDemo(name).kind).toBe("demo");
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
    const Current = map.current;
    render(<Current name="current" params={{}} />);
    expect(screen.getByText("stub:current:{}")).toBeInTheDocument();
    const Retired = map.gone;
    render(<Retired name="gone" params={{}} />);
    expect(screen.getByText("This demo has moved")).toBeInTheDocument();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/some-essay");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
  });
  it("maps every alias to its target's component", () => {
    const map = deriveDemos(testRegistry);
    const Old = map.old;
    expect(Old).toBe(map.current);
    render(<Old name="old" params={{ a: "1" }} />);
    expect(screen.getByText('stub:old:{"a":"1"}')).toBeInTheDocument();
  });
  it("derives the real registry", () => {
    expect(Object.keys(deriveDemos(registry))).toEqual(Object.keys(demoMeta));
  });
});

describe("withoutFrameParams", () => {
  it("passes demo params through and drops theme, bg and chrome", () => {
    const Wrapped = withoutFrameParams(Stub);
    render(
      <Wrapped
        name="x"
        params={{
          stiffness: "500",
          theme: "dark",
          bg: "transparent",
          chrome: "0",
        }}
      />,
    );
    expect(screen.getByText('stub:x:{"stiffness":"500"}')).toBeInTheDocument();
  });
});

describe("demo component map", () => {
  it("has exactly the names in demoMeta", () => {
    expect(Object.keys(demoComponents).sort()).toEqual(
      Object.keys(demoMeta).sort(),
    );
  });
  it("has a lazy loader for every demo", () => {
    expect([...lazyDemoNames].sort()).toEqual(Object.keys(demoMeta).sort());
  });
});

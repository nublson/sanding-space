import { render } from "@testing-library/react";
import { SiteDemoFrame } from "@/components/stage/demo-frame";
import {
  DemoStage,
  ESSAY_STAGE_HEIGHT,
  essayStageHeight,
} from "@/components/stage/demo-stage";

vi.mock("@/lib/demo-meta", async (orig) =>
  (await import("@/test/fake-demos")).mockDemoMeta(orig),
);

describe("essayStageHeight", () => {
  it("is the registry height, following aliases", () => {
    expect(essayStageHeight("test-demo")).toBe(320);
    expect(essayStageHeight("old-name")).toBe(320);
    expect(essayStageHeight("essayless-demo")).toBe(200);
  });

  it("falls back for unknown or missing demos", () => {
    expect(essayStageHeight("nope")).toBe(ESSAY_STAGE_HEIGHT);
    expect(essayStageHeight(null)).toBe(ESSAY_STAGE_HEIGHT);
  });
});

describe("DemoStage", () => {
  it("gives the essay stage a fixed height instead of an aspect ratio", () => {
    const { container } = render(<DemoStage size="essay" height={320} />);
    const stage = container.firstElementChild as HTMLElement;
    expect(stage.style.height).toBe("320px");
    expect(stage.className).not.toMatch(/aspect-/);
  });

  it("keeps the aspect ratio on cards", () => {
    const hero = render(<DemoStage size="hero" />).container.firstElementChild;
    expect(hero).toHaveClass("aspect-[2/1]");
    expect((hero as HTMLElement).style.height).toBe("");
    const card = render(<DemoStage size="card" />).container.firstElementChild;
    expect(card).toHaveClass("aspect-[4/3]");
  });
});

describe("SiteDemoFrame", () => {
  it("sizes an inline demo's stage from the registry", () => {
    const { container } = render(
      <SiteDemoFrame name="essayless-demo" caption={[]} context={{} as never}>
        <span />
      </SiteDemoFrame>,
    );
    const stage = container.querySelector("figure > div") as HTMLElement;
    expect(stage.style.height).toBe("200px");
  });
});

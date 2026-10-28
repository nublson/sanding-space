import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { playSound } from "@/lib/sounds";
import { DemoLayout } from "./demo-layout";
import { GuidesToggle } from "./guides-toggle";
import { showsControls } from "./presets";
import { SegmentedSwitch } from "./segmented-switch";
import { useGuides } from "./use-guides";

vi.mock("@/lib/sounds", () => ({ playSound: vi.fn() }));

const OPTIONS = [
  { value: "press", label: "Press" },
  { value: "pressure", label: "Pressure" },
] as const;

beforeEach(() => vi.mocked(playSound).mockClear());

describe("SegmentedSwitch", () => {
  function renderSwitch(
    onChange = vi.fn(),
    value: "press" | "pressure" = "press",
  ) {
    render(
      <>
        <button type="button">before</button>
        <SegmentedSwitch
          label="Press mode"
          options={OPTIONS}
          value={value}
          onChange={onChange}
        />
      </>,
    );
    return onChange;
  }

  it("is a labelled radio group with the active option checked", () => {
    renderSwitch();
    expect(
      screen.getByRole("radiogroup", { name: "Press mode" }),
    ).toBeVisible();
    expect(screen.getByRole("radio", { name: "Press" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Pressure" })).not.toBeChecked();
  });

  it("changes to the other option with a tap", async () => {
    const onChange = renderSwitch();
    await userEvent.click(screen.getByRole("radio", { name: "Pressure" }));
    expect(onChange).toHaveBeenCalledWith("pressure");
    expect(playSound).toHaveBeenCalledWith("tap");
  });

  it("ignores a press on the active option", async () => {
    const onChange = renderSwitch();
    await userEvent.click(screen.getByRole("radio", { name: "Press" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(playSound).not.toHaveBeenCalled();
  });

  it("puts the tab stop on the active option, even when it is second", async () => {
    renderSwitch(vi.fn(), "pressure");
    screen.getByRole("button", { name: "before" }).focus();
    await userEvent.tab();
    expect(screen.getByRole("radio", { name: "Pressure" })).toHaveFocus();
  });
});

describe("GuidesToggle", () => {
  it("turns on with the toggle-on sound", async () => {
    const onChange = vi.fn();
    render(<GuidesToggle pressed={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Guides" }));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(playSound).toHaveBeenCalledWith("toggle-on");
  });

  it("turns off with the toggle-off sound", async () => {
    const onChange = vi.fn();
    render(<GuidesToggle pressed onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Guides" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(screen.getByRole("button", { name: "Guides" }));
    expect(onChange).toHaveBeenCalledWith(false);
    expect(playSound).toHaveBeenCalledWith("toggle-off");
  });
});

describe("useGuides", () => {
  function Harness({ params }: { params: Record<string, string> }) {
    const { guides, control } = useGuides(params);
    return (
      <>
        {control}
        <output>{String(guides)}</output>
      </>
    );
  }

  it("shows no control and stays off without the param", () => {
    render(<Harness params={{}} />);
    expect(screen.queryByRole("button", { name: "Guides" })).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("false");
  });

  it("starts on with guides=on", () => {
    render(<Harness params={{ guides: "on" }} />);
    expect(screen.getByRole("button", { name: "Guides" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("status")).toHaveTextContent("true");
  });

  it("keeps guides on but hides the chip with controls=off", () => {
    render(<Harness params={{ guides: "on", controls: "off" }} />);
    expect(screen.queryByRole("button", { name: "Guides" })).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("true");
  });

  it("shows the control, off, for an unknown value, and toggles", async () => {
    render(<Harness params={{ guides: "yes" }} />);
    const chip = screen.getByRole("button", { name: "Guides" });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(chip);
    expect(screen.getByRole("status")).toHaveTextContent("true");
  });
});

describe("showsControls", () => {
  it("shows controls unless controls=off", () => {
    expect(showsControls({})).toBe(true);
    expect(showsControls({ controls: "on" })).toBe(true);
    expect(showsControls({ controls: "maybe" })).toBe(true);
    expect(showsControls({ controls: "off" })).toBe(false);
  });
});

describe("DemoLayout", () => {
  it("orders top, subject, bottom", () => {
    render(
      <DemoLayout top={<span>top</span>} bottom={<span>bottom</span>}>
        <span>subject</span>
      </DemoLayout>,
    );
    const top = screen.getByText("top");
    const subject = screen.getByText("subject");
    const bottom = screen.getByText("bottom");
    expect(top.compareDocumentPosition(subject)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(subject.compareDocumentPosition(bottom)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("renders only the subject without slots", () => {
    const { container } = render(
      <DemoLayout>
        <span>subject</span>
      </DemoLayout>,
    );
    expect(container.firstElementChild?.childElementCount).toBe(1);
  });

  it("adds no padding without slots, so a bare demo keeps its size", () => {
    const { container } = render(
      <DemoLayout>
        <span>subject</span>
      </DemoLayout>,
    );
    expect(container.firstElementChild?.className).not.toMatch(/\bpy-/);
  });
});

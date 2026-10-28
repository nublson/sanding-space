import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Surface from "./surface";

vi.mock("@/lib/sounds", () => ({ playSound: vi.fn() }));

// jsdom has no 2D context, so the field's effect exits early: these tests
// cover the markup the params produce, not the physics.
const TODAY =
  "A field of dots that yields under your pointer. Press and drag to push it; arrow keys move, Space presses.";

function canvasLabel(container: HTMLElement): string | null {
  return container.querySelector("canvas")?.getAttribute("aria-label") ?? null;
}

describe("Surface controls", () => {
  it("renders no controls without params, as today", () => {
    const { container } = render(<Surface name="surface" params={{}} />);
    expect(screen.queryByRole("button", { name: "Guides" })).toBeNull();
    expect(screen.queryByRole("radiogroup", { name: "Press mode" })).toBeNull();
    expect(canvasLabel(container)).toBe(TODAY);
  });

  it("starts on Pressure with pressure=on", () => {
    const { container } = render(
      <Surface name="surface" params={{ pressure: "on" }} />,
    );
    expect(screen.getByRole("radio", { name: "Pressure" })).toBeChecked();
    expect(canvasLabel(container)).toContain("Press harder");
  });

  it("shows both controls, off, for unknown values", () => {
    render(
      <Surface name="surface" params={{ pressure: "maybe", guides: "yes" }} />,
    );
    expect(screen.getByRole("radio", { name: "Press" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Guides" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("shows only the Guides chip with guides=on", () => {
    render(<Surface name="surface" params={{ guides: "on" }} />);
    expect(screen.getByRole("button", { name: "Guides" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByRole("radiogroup", { name: "Press mode" })).toBeNull();
  });

  it("locks Pressure with no switch when controls=off", () => {
    const { container } = render(
      <Surface name="surface" params={{ pressure: "on", controls: "off" }} />,
    );
    expect(screen.queryByRole("radiogroup", { name: "Press mode" })).toBeNull();
    expect(canvasLabel(container)).toContain("Press harder");
  });
});

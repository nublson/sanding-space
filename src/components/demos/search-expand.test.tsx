import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SearchExpand from "./search-expand";

vi.mock("@/lib/sounds", () => ({ playSound: vi.fn() }));

describe("SearchExpand controls", () => {
  it("shows the switch on Over-animated without params", () => {
    render(<SearchExpand name="search-expand" params={{}} />);
    expect(screen.getByRole("searchbox", { name: "Search" })).toBeVisible();
    expect(screen.getByRole("radio", { name: "Over-animated" })).toBeChecked();
  });

  it("starts on Refined with refined=on", () => {
    render(<SearchExpand name="search-expand" params={{ refined: "on" }} />);
    expect(screen.getByRole("radio", { name: "Refined" })).toBeChecked();
  });

  it("falls back to Over-animated for an unknown value", () => {
    render(<SearchExpand name="search-expand" params={{ refined: "maybe" }} />);
    expect(screen.getByRole("radio", { name: "Over-animated" })).toBeChecked();
  });

  it("hides the switch with controls=off", () => {
    render(
      <SearchExpand
        name="search-expand"
        params={{ refined: "on", controls: "off" }}
      />,
    );
    expect(screen.queryByRole("radiogroup", { name: "Animation" })).toBeNull();
    expect(screen.getByRole("searchbox", { name: "Search" })).toBeVisible();
  });
});

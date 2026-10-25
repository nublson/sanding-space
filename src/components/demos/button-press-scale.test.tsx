import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ButtonPressScale from "./button-press-scale";

describe("ButtonPressScale", () => {
  it("renders a button named Press and hold", () => {
    render(<ButtonPressScale name="button-press-scale" params={{}} />);
    expect(
      screen.getByRole("button", { name: "Press and hold" }),
    ).toBeInTheDocument();
  });
  it("renders with invalid params", () => {
    render(
      <ButtonPressScale
        name="button-press-scale"
        params={{ stiffness: "abc" }}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Press and hold" }),
    ).toBeInTheDocument();
  });
});

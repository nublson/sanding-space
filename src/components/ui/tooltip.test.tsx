import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";
import { Tooltip, TooltipProvider } from "./tooltip";

function Fixture() {
  return (
    <TooltipProvider delay={0}>
      <Tooltip label="Copy link">
        <Button aria-label="Copy link">L</Button>
      </Tooltip>
    </TooltipProvider>
  );
}

describe("Tooltip", () => {
  it("shows its label on hover", async () => {
    render(<Fixture />);
    await userEvent.hover(screen.getByRole("button", { name: "Copy link" }));
    expect(
      await screen.findByText("Copy link", { selector: "[data-slot=tooltip]" }),
    ).toBeInTheDocument();
  });

  it("shows its label on keyboard focus", async () => {
    render(<Fixture />);
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Copy link" })).toHaveFocus();
    expect(
      await screen.findByText("Copy link", { selector: "[data-slot=tooltip]" }),
    ).toBeInTheDocument();
  });

  it("leaves the button's accessible name alone", async () => {
    render(<Fixture />);
    const button = screen.getByRole("button", { name: "Copy link" });
    await userEvent.hover(button);
    await screen.findByText("Copy link", { selector: "[data-slot=tooltip]" });
    expect(button).not.toHaveAttribute("aria-describedby");
  });

  it("hides on Escape", async () => {
    render(<Fixture />);
    await userEvent.tab();
    await screen.findByText("Copy link", { selector: "[data-slot=tooltip]" });
    fireEvent.keyDown(document.activeElement as Element, { key: "Escape" });
    await waitFor(() =>
      expect(document.querySelector("[data-slot=tooltip]")).toBeNull(),
    );
  });
});

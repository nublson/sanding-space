import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Menu,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "./menu";

function Fixture() {
  return (
    <Menu>
      <MenuTrigger>Share</MenuTrigger>
      <MenuPopup>
        <MenuItem>Story</MenuItem>
        <MenuSeparator />
        <MenuLinkItem href="https://claude.ai/new">Claude</MenuLinkItem>
      </MenuPopup>
    </Menu>
  );
}

describe("Menu", () => {
  it("opens a menu with its items from the trigger", async () => {
    render(<Fixture />);
    await userEvent.click(screen.getByRole("button", { name: "Share" }));

    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem")).toHaveLength(2);
    expect(screen.getByRole("menuitem", { name: "Claude" })).toHaveAttribute(
      "href",
      "https://claude.ai/new",
    );
  });

  it("forwards the props it's given to the popup", async () => {
    const onKeyDown = vi.fn();
    render(
      <Menu>
        <MenuTrigger>Share</MenuTrigger>
        <MenuPopup aria-label="Share options" onKeyDown={onKeyDown}>
          <MenuItem>Story</MenuItem>
        </MenuPopup>
      </Menu>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Share" }));

    const menu = await screen.findByRole("menu", { name: "Share options" });
    // Focus moves into the menu after it opens; the key must land there.
    await waitFor(() =>
      expect(menu.contains(document.activeElement)).toBe(true),
    );
    await userEvent.keyboard("{ArrowDown}");
    expect(menu).toBeInTheDocument();
    expect(onKeyDown).toHaveBeenCalled();
  });

  it("moves focus with the arrow keys", async () => {
    render(<Fixture />);
    screen.getByRole("button", { name: "Share" }).focus();
    await userEvent.keyboard("{Enter}");
    await screen.findByRole("menu");
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "Story" })).toHaveFocus(),
    );
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Claude" })).toHaveFocus();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "Share" });
    await userEvent.click(trigger);
    await screen.findByRole("menu");
    await userEvent.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(trigger).toHaveFocus();
  });
});

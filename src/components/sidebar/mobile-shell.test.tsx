import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileShell } from "@/components/sidebar/mobile-shell";

function setup() {
  render(
    <MobileShell
      sidebar={
        <nav aria-label="Sections">
          <a href="/sections/interaction">Interaction</a>
        </nav>
      }
    >
      <p>Page content</p>
    </MobileShell>,
  );
  return {
    toggle: screen.getByRole("button", { name: /sidebar/i }),
    content: () => screen.getByText("Page content").closest("[data-content]"),
  };
}

describe("MobileShell", () => {
  it("starts closed with aria-expanded=false and aria-controls pointing at the sidebar", () => {
    const { toggle, content } = setup();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    const sidebar = document.getElementById(
      toggle.getAttribute("aria-controls") ?? "",
    );
    expect(sidebar).toContainElement(screen.getByRole("navigation"));
    expect(content()).not.toHaveAttribute("inert");
  });

  it("opens: aria-expanded true, content inert, focus moves into the sidebar", async () => {
    const user = userEvent.setup();
    const { toggle, content } = setup();
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(content()).toHaveAttribute("inert");
    const sidebar = document.getElementById(
      toggle.getAttribute("aria-controls") ?? "",
    );
    expect(sidebar).toContainElement(document.activeElement as HTMLElement);
  });

  it("Escape closes and returns focus to the toggle", async () => {
    const user = userEvent.setup();
    const { toggle, content } = setup();
    await user.click(toggle);
    await user.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(content()).not.toHaveAttribute("inert");
    expect(toggle).toHaveFocus();
  });

  it("clicking a sidebar link closes it", async () => {
    const user = userEvent.setup();
    const { toggle } = setup();
    await user.click(toggle);
    await user.click(screen.getByRole("link", { name: "Interaction" }));
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("clicking the pushed content closes it", async () => {
    const user = userEvent.setup();
    const { toggle } = setup();
    await user.click(toggle);
    await user.click(screen.getByTestId("shell-scrim"));
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("carries data-sound toggle-on when closed and toggle-off when open", async () => {
    const user = userEvent.setup();
    const { toggle } = setup();
    expect(toggle).toHaveAttribute("data-sound", "toggle-on");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("data-sound", "toggle-off");
  });
});

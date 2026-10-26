import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileShell } from "@/components/sidebar/mobile-shell";

let pathname = "/introduction";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

beforeEach(() => {
  pathname = "/introduction";
});

const shell = () => (
  <MobileShell
    sidebar={
      <nav aria-label="Sections">
        <a href="/sections/interaction">Interaction</a>
        <a href="/introduction">Introduction</a>
      </nav>
    }
  >
    <p>Page content</p>
  </MobileShell>
);

function setup() {
  const { rerender } = render(shell());
  return {
    toggle: screen.getByRole("button", { name: /sidebar/i }),
    content: () => screen.getByText("Page content").closest("[data-content]"),
    track: () => document.querySelector(".shell-track"),
    navigate: (to: string) => {
      pathname = to;
      rerender(shell());
    },
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

  it("stays open until the new page arrives, then closes instantly so the route transition does the slide", async () => {
    const user = userEvent.setup();
    const { toggle, track, navigate } = setup();
    await user.click(toggle);
    expect(track()).toHaveAttribute("data-instant", "false");
    await user.click(screen.getByRole("link", { name: "Interaction" }));
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    navigate("/sections/interaction");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(track()).toHaveAttribute("data-instant", "true");
    // Reopening with the toggle slides again.
    await user.click(toggle);
    expect(track()).toHaveAttribute("data-instant", "false");
  });

  it("a link to the current page closes it with the slide", async () => {
    const user = userEvent.setup();
    const { toggle, track } = setup();
    await user.click(toggle);
    await user.click(screen.getByRole("link", { name: "Introduction" }));
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(track()).toHaveAttribute("data-instant", "false");
  });

  it("closing with the toggle keeps the slide", async () => {
    const user = userEvent.setup();
    const { toggle, track } = setup();
    await user.click(toggle);
    await user.click(toggle);
    expect(track()).toHaveAttribute("data-instant", "false");
  });

  it("clicking the header home link on the home page closes it", async () => {
    const user = userEvent.setup();
    const { toggle } = setup();
    await user.click(toggle);
    await user.click(screen.getByRole("link", { name: "Sanding Space" }));
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

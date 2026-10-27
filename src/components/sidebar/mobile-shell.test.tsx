import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileShell } from "@/components/sidebar/mobile-shell";

let pathname = "/introduction";
const prefetch = vi.fn();
const router = { prefetch };
const playSound = vi.fn();
vi.mock("@/lib/sounds", () => ({
  playSound: (name: string) => playSound(name),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => router,
}));

beforeEach(() => {
  pathname = "/introduction";
  prefetch.mockClear();
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
  it("prefetches the sidebar's other routes when it opens, not before", async () => {
    const user = userEvent.setup();
    const { toggle } = setup();
    expect(prefetch).not.toHaveBeenCalled();
    await user.click(toggle);
    expect(prefetch).toHaveBeenCalledWith("/sections/interaction");
    // The current page needs no prefetch.
    expect(prefetch).not.toHaveBeenCalledWith("/introduction");
  });

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

describe("MobileShell swipe", () => {
  const WIDTH = 208;
  let matches = true;

  beforeEach(() => {
    matches = true;
    playSound.mockClear();
    // A live MediaQueryList: `matches` follows the viewport as it changes.
    vi.stubGlobal("matchMedia", (query: string) => ({
      get matches() {
        return query.startsWith("(max-width") ? matches : !matches;
      },
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(
      WIDTH,
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // jsdom stamps events with the real clock; pin it so speeds are known.
  function touch(
    type: "pointerDown" | "pointerMove" | "pointerUp",
    target: Element,
    x: number,
    { y = 300, t = 0, pointerType = "touch" } = {},
  ) {
    const event = createEvent[type](target, {
      pointerId: 1,
      isPrimary: true,
      pointerType,
      clientX: x,
      clientY: y,
    });
    Object.defineProperty(event, "timeStamp", { value: t });
    fireEvent(target, event);
  }

  // A touch drag along x, `steps` moves of `dx / steps` 16ms apart.
  function swipe(
    target: Element,
    dx: number,
    { dy = 0, steps = 10, pointerType = "touch" } = {},
  ) {
    touch("pointerDown", target, 100, { pointerType });
    for (let i = 1; i <= steps; i++) {
      touch("pointerMove", target, 100 + (dx * i) / steps, {
        y: 300 + (dy * i) / steps,
        t: i * 16,
        pointerType,
      });
    }
    touch("pointerUp", target, 100 + dx, {
      y: 300 + dy,
      t: steps * 16,
      pointerType,
    });
  }

  it("a swipe right opens it and a swipe left closes it", () => {
    const { toggle } = setup();
    swipe(screen.getByText("Page content"), 160);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(playSound).toHaveBeenLastCalledWith("toggle-on");
    swipe(screen.getByRole("link", { name: "Interaction" }), -160);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(playSound).toHaveBeenLastCalledWith("toggle-off");
  });

  it("the track follows the finger from where it was, then hands back to CSS", () => {
    const { track } = setup();
    const content = screen.getByText("Page content");
    const style = () => (track() as HTMLElement).style;
    touch("pointerDown", content, 100);
    // The drag takes over here without moving the content...
    touch("pointerMove", content, 120, { t: 16 });
    expect(style().translate).toBe("-208px 0");
    expect(style().willChange).toBe("translate");
    // ...then follows the finger one to one.
    touch("pointerMove", content, 150, { t: 32 });
    expect(style().translate).toBe("-178px 0");
    touch("pointerUp", content, 150, { t: 800 });
    expect(style().translate).toBe("");
  });

  it("a fast release slides on at the finger's speed; a slow one uses the spring", () => {
    const { track } = setup();
    const content = screen.getByText("Page content");
    // 120px in 80ms: 1.5px/ms at release.
    swipe(content, 120, { steps: 5 });
    expect((track() as HTMLElement).style.transition).toMatch(
      /^translate \d+ms cubic-bezier\(0\.2, /,
    );
    // Dragged, then held still before letting go: nothing to carry, so the
    // stylesheet's push spring settles it, as the toggle does.
    const link = screen.getByRole("link", { name: "Interaction" });
    touch("pointerDown", link, 100);
    touch("pointerMove", link, 80, { t: 16 });
    touch("pointerMove", link, -20, { t: 400 });
    touch("pointerUp", link, -20, { t: 900 });
    expect((track() as HTMLElement).style.transition).toBe("");
  });

  it("a flick that stops before the finger lifts is not a flick", () => {
    const { toggle } = setup();
    const content = screen.getByText("Page content");
    touch("pointerDown", content, 100);
    touch("pointerMove", content, 115, { t: 16 });
    // 45px in 32ms, then held for most of a second.
    touch("pointerMove", content, 160, { t: 48 });
    touch("pointerUp", content, 160, { t: 900 });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("a short, slow drag falls back to where it was", () => {
    const { toggle } = setup();
    swipe(screen.getByText("Page content"), 40, { steps: 40 });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("ignores vertical drags, mouse drags, demo stages and desktop", () => {
    const { toggle } = setup();
    const content = screen.getByText("Page content");
    swipe(content, 30, { dy: 160 });
    swipe(content, 160, { pointerType: "mouse" });
    content.setAttribute("data-swipe-ignore", "");
    swipe(content, 160);
    content.removeAttribute("data-swipe-ignore");
    matches = false;
    swipe(content, 160);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(playSound).not.toHaveBeenCalled();
  });

  it("a swipe that ends on the scrim does not also press it", async () => {
    const user = userEvent.setup();
    const { toggle } = setup();
    await user.click(toggle);
    const scrim = screen.getByTestId("shell-scrim");
    // A short drag towards closed falls back open; its trailing click is swallowed.
    swipe(scrim, -40, { steps: 40 });
    fireEvent.click(scrim);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("only the click that comes with lifting is swallowed, not a later one", async () => {
    const user = userEvent.setup();
    const { toggle } = setup();
    swipe(screen.getByText("Page content"), 160);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    // A keyboard press well after the swipe fires a click with no pointer.
    vi.spyOn(performance, "now").mockReturnValue(performance.now() + 1000);
    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});

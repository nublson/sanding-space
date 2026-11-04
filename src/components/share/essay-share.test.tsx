import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { copyText } from "@/lib/clipboard";
import { llmPrompt } from "@/lib/share";
import { EssayShare } from "./essay-share";

vi.mock("@/lib/clipboard", () => ({ copyText: vi.fn() }));

const url = "https://sanding.space/button-press";

const png = () =>
  new Response(new Blob(["png"], { type: "image/png" }), { status: 200 });

function setNavigator(share?: (data: ShareData) => Promise<void>) {
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: share,
  });
  Object.defineProperty(navigator, "canShare", {
    configurable: true,
    value: share ? () => true : undefined,
  });
}

const storyFetch = vi.fn();
const markdownFetch = vi.fn();

beforeEach(() => {
  storyFetch.mockReset().mockImplementation(async () => png());
  markdownFetch
    .mockReset()
    .mockImplementation(async () => new Response("# Button Press\n"));
  vi.mocked(copyText)
    .mockReset()
    .mockImplementation(async (text) => {
      await text;
    });
  vi.stubGlobal("fetch", (input: string) =>
    input.startsWith("/api/markdown/")
      ? markdownFetch(input)
      : storyFetch(input),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  setNavigator(undefined);
});

const apply = "- Scale to 0.97.";

function renderShare() {
  render(
    <EssayShare
      slug="button-press"
      title="Button Press"
      url={url}
      apply={apply}
    />,
  );
}

async function openMenu() {
  await userEvent.click(screen.getByRole("button", { name: "Share" }));
  return screen.findByRole("menu");
}

const storyItem = () => screen.getByRole("menuitem", { name: /story/i });

describe("EssayShare", () => {
  it("shows copy-as-Markdown, copy-link and share buttons", () => {
    renderShare();
    for (const name of ["Copy as Markdown", "Copy link", "Share"])
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
  });

  it.each([
    "Copy as Markdown",
    "Copy link",
    "Share",
  ])("labels the %s button with a tooltip", async (name) => {
    renderShare();
    await userEvent.hover(screen.getByRole("button", { name }));
    expect(
      await screen.findByText(name, { selector: "[data-slot=tooltip]" }),
    ).toBeInTheDocument();
  });

  it("copies the essay URL", async () => {
    renderShare();
    await userEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(copyText).toHaveBeenCalledWith(url);
  });

  it("copies the page's Markdown, without the Apply brief, fetched once across prefetch and press", async () => {
    renderShare();
    const button = screen.getByRole("button", { name: "Copy as Markdown" });
    fireEvent.focus(button);
    await userEvent.click(button);

    expect(markdownFetch).toHaveBeenCalledTimes(1);
    expect(markdownFetch).toHaveBeenCalledWith(
      "/api/markdown/button-press?apply=off",
    );
    await expect(vi.mocked(copyText).mock.calls[0][0]).resolves.toBe(
      "# Button Press\n",
    );
  });

  it("fetches the Markdown again after a failure", async () => {
    markdownFetch.mockImplementationOnce(
      async () => new Response("", { status: 503 }),
    );
    vi.mocked(copyText).mockImplementation(async (text) => {
      await text;
    });
    renderShare();
    const button = screen.getByRole("button", { name: "Copy as Markdown" });

    fireEvent.click(button);
    await screen.findByRole("button", { name: /couldn't copy the markdown/i });
    fireEvent.click(button);

    await waitFor(() => expect(markdownFetch).toHaveBeenCalledTimes(2));
    await screen.findByRole("button", { name: "Copied" });
  });

  it("copies a prompt pointing at the essay's Markdown, then closes the menu", async () => {
    renderShare();
    await openMenu();
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Copy to LLM" }),
    );

    expect(copyText).toHaveBeenCalledWith(
      llmPrompt("Button Press", url, apply),
    );
    expect(
      await screen.findByRole("menuitem", { name: "Copied" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("resets Copy to LLM when the menu closes, so a reopened menu stays open", async () => {
    renderShare();
    await openMenu();
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Copy to LLM" }),
    );
    await screen.findByRole("menuitem", { name: "Copied" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());

    await openMenu();
    expect(
      screen.getByRole("menuitem", { name: "Copy to LLM" }),
    ).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("keeps the menu open and offers a retry when Copy to LLM fails", async () => {
    vi.mocked(copyText).mockRejectedValueOnce(new Error("denied"));
    renderShare();
    await openMenu();
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Copy to LLM" }),
    );

    expect(
      await screen.findByRole("menuitem", { name: "Couldn't copy. Try again" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("separates Copy to LLM from the share items", async () => {
    renderShare();
    const menu = await openMenu();
    const items = [...menu.querySelectorAll("[data-slot]")].map((el) =>
      el.getAttribute("data-slot"),
    );
    expect(items.slice(0, 3)).toEqual([
      "menu-item",
      "menu-separator",
      "menu-item",
    ]);
  });

  it("keeps the story icons mounted and shows one, for the cross-fade", async () => {
    renderShare();
    await openMenu();
    const icons = storyItem().querySelectorAll("[data-icon]");
    expect(icons).toHaveLength(3);
    expect(
      [...icons]
        .filter((icon) => icon.getAttribute("data-shown") === "true")
        .map((icon) => icon.getAttribute("data-icon")),
    ).toEqual(["idle"]);
  });

  it("names the story item Share story", async () => {
    renderShare();
    await openMenu();
    expect(storyItem()).toHaveAccessibleName("Share story");
  });

  it("offers Share… only where the browser can share", async () => {
    renderShare();
    await openMenu();
    expect(screen.queryByRole("menuitem", { name: "Share…" })).toBeNull();
  });

  it("shares the title and URL through the share sheet", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator(share);
    renderShare();
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: "Share…" }));
    expect(share).toHaveBeenCalledWith({ title: "Button Press", url });
  });

  it.each([
    ["shared", undefined],
    ["dismissed", new DOMException("closed", "AbortError")],
  ])("keeps the menu open while the share sheet is up, then closes it (%s)", async (_, outcome) => {
    let settle: () => void = () => {};
    const share = vi.fn(
      () =>
        new Promise<void>((resolve, reject) => {
          settle = () => (outcome ? reject(outcome) : resolve());
        }),
    );
    setNavigator(share);
    renderShare();
    await openMenu();

    await userEvent.click(screen.getByRole("menuitem", { name: "Share…" }));
    expect(share).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    settle();
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("drops Preparing the story once the share sheet is up", async () => {
    let finish: () => void = () => {};
    const share = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    setNavigator(share);
    renderShare();
    await openMenu();

    await userEvent.click(storyItem());
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(storyItem()).toHaveAccessibleName("Share story");
    expect(storyItem()).not.toHaveAttribute("aria-busy", "true");

    finish();
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("shares the story PNG and closes the menu", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator(share);
    renderShare();
    await openMenu();

    await userEvent.click(storyItem());

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(storyFetch).toHaveBeenCalledWith("/api/story-image/button-press");
    const [file] = share.mock.calls[0][0].files;
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe("button-press-story.png");
    expect(share.mock.calls[0][0]).toEqual({ files: [file] });
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("downloads the story when files can't be shared", async () => {
    URL.createObjectURL = vi.fn(() => "blob:story");
    URL.revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    renderShare();
    await openMenu();

    await userEvent.click(storyItem());

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    const anchor = click.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe("button-press-story.png");
    click.mockRestore();
  });

  it("stays open for a second tap when Safari refuses a late share", async () => {
    const share = vi
      .fn()
      .mockRejectedValueOnce(new DOMException("late", "NotAllowedError"))
      .mockResolvedValueOnce(undefined);
    setNavigator(share);
    renderShare();
    await openMenu();

    await userEvent.click(storyItem());
    const ready = await screen.findByRole("menuitem", {
      name: "Story ready. Share it",
    });
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await userEvent.click(ready);

    await waitFor(() => expect(share).toHaveBeenCalledTimes(2));
    expect(storyFetch).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("shows an error and fetches the story again on retry", async () => {
    storyFetch
      .mockResolvedValueOnce(new Response("{}", { status: 500 }))
      .mockResolvedValueOnce(new Response("{}", { status: 500 }));
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator(share);
    renderShare();
    await openMenu();

    fireEvent.click(storyItem());
    const retry = await screen.findByRole("menuitem", {
      name: "Couldn't make the story. Try again",
    });
    expect(screen.getByText("Couldn't make the story.")).toHaveAttribute(
      "aria-live",
      "polite",
    );
    fireEvent.click(retry);

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(storyFetch).toHaveBeenCalledTimes(3);
  });
});

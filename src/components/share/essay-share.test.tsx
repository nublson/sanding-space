import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { copyText } from "@/lib/clipboard";
import { agentPrompt, openInLinks } from "@/lib/share";
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

function renderShare(hasApply = true) {
  render(
    <EssayShare
      slug="button-press"
      title="Button Press"
      url={url}
      hasApply={hasApply}
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

  it("copies the essay URL", async () => {
    renderShare();
    await userEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(copyText).toHaveBeenCalledWith(url);
  });

  it("copies the Markdown, fetched once across prefetch and press", async () => {
    renderShare();
    const button = screen.getByRole("button", { name: "Copy as Markdown" });
    fireEvent.focus(button);
    await userEvent.click(button);

    expect(markdownFetch).toHaveBeenCalledTimes(1);
    expect(markdownFetch).toHaveBeenCalledWith("/api/markdown/button-press");
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

  it.each([
    true,
    false,
  ])("links to Claude, ChatGPT and Cursor with the prompt (brief: %s)", async (hasApply) => {
    renderShare(hasApply);
    await openMenu();
    for (const link of openInLinks(agentPrompt(url, hasApply))) {
      const item = screen.getByRole("menuitem", {
        name: `Open in ${link.name} (opens in a new tab)`,
      });
      expect(item).toHaveAttribute("href", link.href);
      expect(item).toHaveAttribute("target", "_blank");
      expect(item.getAttribute("rel")).toContain("noopener");
    }
  });

  it("names the story item Share story", async () => {
    renderShare();
    await openMenu();
    expect(storyItem()).toHaveAccessibleName("Share story");
  });

  it("offers Share link only where the browser can share", async () => {
    renderShare();
    await openMenu();
    expect(screen.queryByRole("menuitem", { name: /share link/i })).toBeNull();
  });

  it("shares the title and URL through the share sheet", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator(share);
    renderShare();
    await openMenu();
    await userEvent.click(
      screen.getByRole("menuitem", { name: /share link/i }),
    );
    expect(share).toHaveBeenCalledWith({ title: "Button Press", url });
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
      name: /story image ready/i,
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
      name: /couldn't make the story image/i,
    });
    expect(screen.getByText("Couldn't make the story image.")).toHaveAttribute(
      "aria-live",
      "polite",
    );
    fireEvent.click(retry);

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(storyFetch).toHaveBeenCalledTimes(3);
  });
});

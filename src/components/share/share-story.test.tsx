import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShareStory } from "./share-story";

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

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  setNavigator(undefined);
});

describe("ShareStory", () => {
  it("shares a PNG file named after the slug", async () => {
    fetchMock.mockResolvedValue(png());
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator(share);
    render(<ShareStory slug="button-press" />);

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith("/api/story-image/button-press");
    const [file] = share.mock.calls[0][0].files;
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe("button-press-story.png");
    expect(file.type).toBe("image/png");
    expect(share.mock.calls[0][0]).toEqual({ files: [file] });
  });

  it("downloads the file when files can't be shared", async () => {
    fetchMock.mockResolvedValue(png());
    URL.createObjectURL = vi.fn(() => "blob:story");
    URL.revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    render(<ShareStory slug="button-press" />);

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    const anchor = click.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe("button-press-story.png");
    expect(anchor.href).toBe("blob:story");
    click.mockRestore();
  });

  it("waits for a second tap when Safari refuses a late share", async () => {
    fetchMock.mockResolvedValue(png());
    const share = vi
      .fn()
      .mockRejectedValueOnce(new DOMException("late", "NotAllowedError"))
      .mockResolvedValueOnce(undefined);
    setNavigator(share);
    render(<ShareStory slug="button-press" />);

    await userEvent.click(screen.getByRole("button"));
    const ready = await screen.findByRole("button", {
      name: /story image ready/i,
    });
    await userEvent.click(ready);

    await waitFor(() => expect(share).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button")).toHaveAccessibleName(
      "Share this post as a story image",
    );
  });

  it("shows an error and fetches again on retry", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("{}", { status: 500 }))
      .mockResolvedValueOnce(png());
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator(share);
    render(<ShareStory slug="button-press" />);

    // A bare click: hover and focus would prefetch, and retry, on their own.
    fireEvent.click(screen.getByRole("button"));
    const retry = await screen.findByRole("button", {
      name: /couldn't make the story image/i,
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Couldn't make the story image.",
    );
    fireEvent.click(retry);

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

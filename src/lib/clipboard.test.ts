import { copyText } from "./clipboard";

function setClipboard(value: Partial<Clipboard> | undefined) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value,
  });
}

class FakeClipboardItem {
  static last: Record<string, Promise<Blob>> | null = null;
  constructor(items: Record<string, Promise<Blob>>) {
    FakeClipboardItem.last = items;
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  setClipboard(undefined);
  FakeClipboardItem.last = null;
});

describe("copyText", () => {
  it("writes a ClipboardItem that resolves to the text", async () => {
    vi.stubGlobal("ClipboardItem", FakeClipboardItem);
    const write = vi.fn().mockResolvedValue(undefined);
    setClipboard({ write });

    await copyText(Promise.resolve("# Button Press"));

    expect(write).toHaveBeenCalledTimes(1);
    expect(write.mock.calls[0][0][0]).toBeInstanceOf(FakeClipboardItem);
    const blob = await FakeClipboardItem.last?.["text/plain"];
    expect(blob?.type).toBe("text/plain");
    expect(await blob?.text()).toBe("# Button Press");
  });

  it("writes the item before the text resolves", () => {
    vi.stubGlobal("ClipboardItem", FakeClipboardItem);
    const write = vi.fn().mockResolvedValue(undefined);
    setClipboard({ write });

    void copyText(new Promise<string>(() => {}));

    expect(write).toHaveBeenCalledTimes(1);
  });

  it("falls back to writeText without ClipboardItem", async () => {
    vi.stubGlobal("ClipboardItem", undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });

    await copyText("https://sanding.space/button-press");

    expect(writeText).toHaveBeenCalledWith(
      "https://sanding.space/button-press",
    );
  });

  it("falls back to execCommand without a clipboard", async () => {
    vi.stubGlobal("ClipboardItem", undefined);
    const exec = vi.fn().mockReturnValue(true);
    document.execCommand = exec;

    await copyText("https://sanding.space/button-press");

    expect(exec).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("rejects when every way fails", async () => {
    vi.stubGlobal("ClipboardItem", undefined);
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error("no")) });
    document.execCommand = vi.fn().mockReturnValue(false);

    await expect(copyText("x")).rejects.toThrow();
  });
});

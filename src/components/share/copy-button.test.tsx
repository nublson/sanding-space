import { act, fireEvent, render, screen } from "@testing-library/react";
import { Link } from "lucide-react";
import { CopyButton } from "./copy-button";

const writeText = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  writeText.mockReset().mockResolvedValue(undefined);
  vi.stubGlobal("ClipboardItem", undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function renderButton(
  source: () => string | Promise<string>,
  onPrefetch?: () => void,
) {
  render(
    <CopyButton
      label="Copy link"
      failedLabel="Couldn't copy the link. Try again"
      icon={Link}
      source={source}
      onPrefetch={onPrefetch}
    />,
  );
  return screen.getByRole("button");
}

async function press(button: HTMLElement) {
  await act(async () => {
    fireEvent.click(button);
  });
}

describe("CopyButton", () => {
  it("copies, says Copied, then goes back to its label", async () => {
    const source = vi.fn(() => "https://sanding.space/button-press");
    const button = renderButton(source);

    await press(button);

    expect(source).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(
      "https://sanding.space/button-press",
    );
    expect(button).toHaveAccessibleName("Copied");
    expect(screen.getByRole("status")).toHaveTextContent("Copied");

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(button).toHaveAccessibleName("Copy link");
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("says it failed and tries again on the next press", async () => {
    const source = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce("# Button Press");
    const button = renderButton(source);

    await press(button);
    expect(button).toHaveAccessibleName("Couldn't copy the link. Try again");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Couldn't copy the link. Try again",
    );

    await press(button);
    expect(source).toHaveBeenCalledTimes(2);
    expect(writeText).toHaveBeenLastCalledWith("# Button Press");
    expect(button).toHaveAccessibleName("Copied");
  });

  it("prefetches on focus", () => {
    const onPrefetch = vi.fn();
    const button = renderButton(() => "x", onPrefetch);

    fireEvent.focus(button);

    expect(onPrefetch).toHaveBeenCalledTimes(1);
  });
});

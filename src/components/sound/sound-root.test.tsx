import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const playSound = vi.fn();
const setMuted = vi.fn();
const applySavedMute = vi.fn();
let muted = false;

vi.mock("@/lib/sounds", () => ({
  playSound: (n: string) => playSound(n),
  applySavedMute: () => applySavedMute(),
  setMuted: (m: boolean) => {
    muted = m;
    setMuted(m);
  },
  isMuted: () => muted,
}));

import { MuteButton } from "./mute-button";
import { SoundRoot } from "./sound-root";

beforeEach(() => {
  playSound.mockClear();
  setMuted.mockClear();
  applySavedMute.mockClear();
  muted = false;
});

describe("SoundRoot", () => {
  it("applies the saved mute on mount", () => {
    render(<SoundRoot>x</SoundRoot>);
    expect(applySavedMute).toHaveBeenCalledTimes(1);
  });

  it("plays on a data-sound element and its children", () => {
    render(
      <SoundRoot>
        <a href="#x" data-sound="page">
          <span>child</span>
        </a>
        <button type="button">plain</button>
      </SoundRoot>,
    );
    fireEvent.click(screen.getByText("child"));
    expect(playSound).toHaveBeenCalledTimes(1);
    expect(playSound).toHaveBeenCalledWith("page");
    fireEvent.click(screen.getByText("plain"));
    expect(playSound).toHaveBeenCalledTimes(1);
  });

  describe("hover", () => {
    let finePointer = true;
    beforeEach(() => {
      finePointer = true;
      // Live like a real MediaQueryList: `matches` reads the current value.
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        get matches() {
          return finePointer;
        },
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
    });

    function tree() {
      return render(
        <SoundRoot>
          <a href="#a" data-sound-hover="hover">
            <span>a</span>
          </a>
          <a href="#b" data-sound-hover="hover">
            b
          </a>
          <span>outside</span>
        </SoundRoot>,
      );
    }

    it("plays once per item entered with a mouse", () => {
      tree();
      fireEvent.pointerOver(screen.getByText("a"), { pointerType: "mouse" });
      fireEvent.pointerOver(screen.getByText("a").parentElement as Element, {
        pointerType: "mouse",
      });
      expect(playSound).toHaveBeenCalledTimes(1);
      expect(playSound).toHaveBeenCalledWith("hover");
      fireEvent.pointerOver(screen.getByText("b"), { pointerType: "mouse" });
      expect(playSound).toHaveBeenCalledTimes(2);
      fireEvent.pointerOver(screen.getByText("outside"), {
        pointerType: "mouse",
      });
      fireEvent.pointerOver(screen.getByText("b"), { pointerType: "mouse" });
      expect(playSound).toHaveBeenCalledTimes(3);
    });

    it("stays silent for touch, pen and coarse pointers", () => {
      tree();
      fireEvent.pointerOver(screen.getByText("a"), { pointerType: "touch" });
      fireEvent.pointerOver(screen.getByText("b"), { pointerType: "pen" });
      expect(playSound).not.toHaveBeenCalled();
      finePointer = false;
      fireEvent.pointerOver(screen.getByText("a"), { pointerType: "mouse" });
      expect(playSound).not.toHaveBeenCalled();
    });
  });

  it("ignores aria-disabled elements", () => {
    render(
      <SoundRoot>
        <a href="#x" data-sound="page" aria-disabled="true">
          soon
        </a>
      </SoundRoot>,
    );
    fireEvent.click(screen.getByText("soon"));
    expect(playSound).not.toHaveBeenCalled();
  });
});

describe("MuteButton", () => {
  it("flushes a pending mute on unmount", () => {
    vi.useFakeTimers();
    const { unmount } = render(<MuteButton />);
    fireEvent.click(screen.getByRole("button", { name: "Mute sound" }));
    expect(setMuted).not.toHaveBeenCalled();
    unmount();
    expect(setMuted).toHaveBeenCalledWith(true);
    vi.useRealTimers();
  });

  it("toggles aria-pressed and keeps its name", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<MuteButton />);
    const btn = screen.getByRole("button", { name: "Mute sound" });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    await user.click(btn);
    expect(playSound).toHaveBeenCalledWith("toggle-off");
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(setMuted).toHaveBeenCalledWith(true);
    const pressed = screen.getByRole("button", { name: "Mute sound" });
    expect(pressed).toHaveAttribute("aria-pressed", "true");
    await user.click(pressed);
    expect(setMuted).toHaveBeenLastCalledWith(false);
    expect(playSound).toHaveBeenLastCalledWith("toggle-on");
    expect(screen.getByRole("button", { name: "Mute sound" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    vi.useRealTimers();
  });
});

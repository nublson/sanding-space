import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducedMotion } from "motion/react";
import { playSound } from "@/lib/sounds";
import SandedButton from "./sanded-button";

vi.mock("@/lib/sounds", () => ({
  playSound: vi.fn(),
  soundPlayer: () => vi.fn(),
}));
vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: vi.fn(() => false),
}));

/** What the back's transcript reads, as one string. */
function transcript() {
  return screen.getByText(/A screen reader says/).parentElement?.textContent;
}

async function press(name: string) {
  await userEvent.click(screen.getByRole("button", { name }));
}

beforeEach(() => vi.mocked(playSound).mockClear());

describe("SandedButton", () => {
  it.each([
    false,
    true,
  ])("sands each point with its chip (reduced: %s)", async (reduced) => {
    vi.mocked(useReducedMotion).mockReturnValue(reduced);
    render(<SandedButton name="sanded-button" params={{}} />);
    // The front button starts rough: no name, no pressed state.
    // After the turn button, above the card, it is the first button.
    const save = screen.getAllByRole("button")[1];
    expect(save).not.toHaveAccessibleName();
    expect(save).not.toHaveAttribute("aria-pressed");

    await press("Show back");
    expect(playSound).toHaveBeenCalledWith("page");
    expect(transcript()).toBe("A screen reader says: “button”");

    await press("Label");
    expect(screen.getByRole("button", { name: "Label" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(transcript()).toBe("A screen reader says: “Save, button”");
    expect(screen.getByRole("status")).toHaveTextContent("Label sanded.");

    // Any order: the pressed state before the ring and the target.
    await press("Pressed state");
    expect(transcript()).toBe(
      "A screen reader says: “Save, toggle button, not pressed”",
    );

    // Pressing a point again roughs it back up.
    await press("Label");
    expect(transcript()).toBe(
      "A screen reader says: “toggle button, not pressed”",
    );
    expect(playSound).toHaveBeenCalledWith("toggle-off");
    expect(screen.getByRole("status")).toHaveTextContent("Label rough again.");

    // The points sanded on the back are what the front button now has.
    await press("Show front");
    expect(save).not.toHaveAccessibleName();
    expect(save).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(save);
    expect(save).toHaveAttribute("aria-pressed", "true");
    await press("Show back");
    await press("Label");
    await press("Show front");
    expect(save).toHaveAccessibleName("Save");
  });
});

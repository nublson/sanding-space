import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PaperCuts from "./paper-cuts";

/** Each `soundPlayer` the demo makes, in order: the thud first. */
const players = vi.hoisted(() => [] as ReturnType<typeof vi.fn>[]);
vi.mock("@/lib/sounds", () => ({
  playSound: vi.fn(),
  soundPlayer: () => {
    const player = vi.fn();
    players.push(player);
    return player;
  },
}));

function setup() {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(<PaperCuts name="paper-cuts" params={{}} />);
  return user;
}

/** The counter above the panel, e.g. "Cuts 2". */
function counter() {
  return screen.getByText(/^Cuts/).textContent;
}

function wait(ms: number) {
  act(() => vi.advanceTimersByTime(ms));
}

const nameField = () => screen.getByRole("textbox", { name: "Display name" });
const notifications = () =>
  screen.getByRole("switch", { name: "Email notifications" });

async function rename(user: ReturnType<typeof setup>, name: string) {
  await user.clear(nameField());
  await user.type(nameField(), `${name}{Enter}`);
}

afterEach(() => vi.useRealTimers());

describe("PaperCuts", () => {
  it("cuts five ways in the rough run, and says nothing about it", async () => {
    const user = setup();
    expect(counter()).toBe("Cuts 0");

    // The avatar lands while the pointer is on the panel: the rows jump.
    await user.hover(screen.getByRole("dialog", { name: "Settings" }));
    expect(screen.queryByText("ana@example.com")).toBeNull();
    wait(700);
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(counter()).toBe("Cuts 1");

    // Escape throws the unsaved name away.
    await user.clear(nameField());
    await user.type(nameField(), "Ana Souza");
    await user.keyboard("{Escape}");
    expect(counter()).toBe("Cuts 2");
    await user.click(screen.getByRole("button", { name: "Open settings" }));
    expect(nameField()).toHaveValue("Ana Lima");

    // Saving drops focus, and the toast lies over Undo.
    await rename(user, "Ana Souza");
    expect(nameField()).not.toHaveFocus();
    expect(counter()).toBe("Cuts 3");
    await user.click(screen.getByText("Changes saved"));
    expect(counter()).toBe("Cuts 4");

    // The switch waits a second before it moves.
    await user.click(notifications());
    expect(notifications()).not.toBeChecked();
    expect(counter()).toBe("Cuts 5");
    wait(1000);
    expect(notifications()).toBeChecked();

    // Done, and the panel just stays: the cuts are for feeling, not reading.
    wait(2000);
    expect(
      screen.getByRole("dialog", { name: "Settings" }),
    ).toBeInTheDocument();
  });

  it("counts the avatar jump without a sound on hover", async () => {
    const user = setup();
    const thud = players[0];
    thud.mockClear();
    await user.hover(screen.getByRole("dialog", { name: "Settings" }));
    wait(700);
    expect(counter()).toBe("Cuts 1");
    expect(thud).not.toHaveBeenCalled();

    // A cut you act into still thuds.
    await rename(user, "Ana Souza");
    expect(thud).toHaveBeenCalledOnce();
  });

  it("starts the run over from the switch", async () => {
    const user = setup();
    await rename(user, "Ana Souza");
    expect(counter()).toBe("Cuts 1");
    await user.click(screen.getByRole("radio", { name: "Sanded" }));
    expect(counter()).toBe("Cuts 0");
    expect(nameField()).toHaveValue("Ana Lima");
  });

  it("does the same task with no cuts in the sanded run", async () => {
    const user = setup();
    await user.click(screen.getByRole("radio", { name: "Sanded" }));

    // The avatar's place is held, so nothing moves when it lands.
    await user.hover(screen.getByRole("dialog", { name: "Settings" }));
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    wait(700);

    // Escape keeps the draft and hands focus over both ways.
    await user.clear(nameField());
    await user.type(nameField(), "Ana Souza");
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Open settings" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(nameField()).toHaveFocus();
    expect(nameField()).toHaveValue("Ana Souza");

    // Saving keeps focus, and Undo is in the clear.
    await user.keyboard("{Enter}");
    expect(nameField()).toHaveFocus();
    expect(screen.queryByText("Changes saved")).toBeNull();
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();

    await user.click(notifications());
    expect(notifications()).toBeChecked();
    expect(counter()).toBe("Cuts 0");
  });

  it("takes Undo away on a timer only in the rough run", async () => {
    const user = setup();
    await rename(user, "Ana Souza");
    wait(4000);
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();

    await user.click(screen.getByRole("radio", { name: "Sanded" }));
    await rename(user, "Ana Souza");
    wait(10_000);
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
  });

  it("undoes a save", async () => {
    const user = setup();
    await rename(user, "Ana Souza");
    // The rough toast covers it, so reach Undo by keyboard.
    act(() => screen.getByRole("button", { name: "Undo" }).focus());
    await user.keyboard("{Enter}");
    expect(nameField()).toHaveValue("Ana Lima");
  });
});

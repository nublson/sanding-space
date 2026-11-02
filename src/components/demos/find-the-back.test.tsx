import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FindTheBack from "./find-the-back";

vi.mock("@/lib/sounds", () => ({
  playSound: vi.fn(),
  soundPlayer: () => vi.fn(),
}));

function setup(params: Record<string, string> = {}) {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(<FindTheBack name="find-the-back" params={params} />);
  return user;
}

type User = ReturnType<typeof setup>;

function wait(ms: number) {
  act(() => vi.advanceTimersByTime(ms));
}

const email = () => screen.getByRole("textbox", { name: "Email" });
const status = () =>
  within(screen.getByRole("region", { name: "Signup" })).getByRole("status");
/** The next-step hint above the form. */
const hint = () =>
  screen.getAllByRole("status").find((output) => !output.closest("section"));
/** The counter above the form, e.g. "2/6". */
const counter = () => screen.getByText(/^\d\/\d$/).textContent;
const habit = (user: User, name: string) =>
  user.click(screen.getByRole("button", { name }));
const sand = (user: User, name: string) =>
  user.click(screen.getByRole("button", { name: `Sand: ${name}` }));

async function signUp(user: User, address: string) {
  await user.clear(email());
  await user.type(email(), address);
  await user.click(screen.getAllByRole("button")[0]);
}

afterEach(() => vi.useRealTimers());

describe("FindTheBack", () => {
  it("hears the unnamed button, then names it", async () => {
    const user = setup();
    await habit(user, "Screen reader");
    expect(
      screen.getByText(/A screen reader says/).parentElement,
    ).toHaveTextContent("Email, edit text. button.”");
    expect(counter()).toBe("1/6");
    expect(hint()).toHaveTextContent("Found a rough edge. Sand it");
    await sand(user, "Screen reader");
    expect(hint()).toHaveTextContent("Sanded. Try it again");
    expect(
      screen.getByRole("button", { name: "Subscribe" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/A screen reader says/).parentElement,
    ).toHaveTextContent("Subscribe, button.”");
    // The button keeps focus as it turns into "Sanded".
    expect(
      screen.getByRole("button", { name: "Sanded: Screen reader" }),
    ).toHaveFocus();
  });

  it("can't sign up by keyboard until sanded", async () => {
    const user = setup();
    expect(hint()).toHaveTextContent("Pick a habit below");
    await habit(user, "No mouse");
    expect(email()).toHaveFocus();
    // The habit starts with an address in, and the hint says what to try.
    expect(email()).toHaveValue("ana@example.com");
    expect(hint()).toHaveTextContent("Sign up with only Tab and Enter.");
    await user.keyboard("{Enter}");
    wait(500);
    expect(status()).toHaveTextContent("");
    expect(counter()).toBe("1/6");

    await sand(user, "No mouse");
    act(() => email().focus());
    await user.keyboard("{Enter}");
    wait(500);
    expect(status()).toHaveTextContent("You're subscribed.");
  });

  it("rejects a pasted address with spaces until sanded", async () => {
    const user = setup();
    await habit(user, "Paste");
    expect(email()).toHaveValue(" Nubelson@Example.com ");
    await user.click(screen.getAllByRole("button")[0]);
    expect(status()).toHaveTextContent("Enter an email like ana@example.com.");
    expect(counter()).toBe("1/6");

    await sand(user, "Paste");
    await user.click(screen.getAllByRole("button")[0]);
    expect(email()).toHaveValue("nubelson@example.com");
    wait(500);
    expect(status()).toHaveTextContent("You're subscribed.");
  });

  it("sends twice on a slow network until sanded", async () => {
    const user = setup();
    await habit(user, "Slow network");
    await signUp(user, "ana@example.com");
    expect(status()).toHaveTextContent("");
    await user.click(screen.getAllByRole("button")[0]);
    wait(3000);
    expect(status()).toHaveTextContent("Subscribed 2 times.");

    await sand(user, "Slow network");
    await signUp(user, "ana@example.com");
    expect(status()).toHaveTextContent("Subscribing…");
    await user.click(screen.getAllByRole("button")[0]);
    wait(3000);
    expect(status()).toHaveTextContent("You're subscribed.");
  });

  it("loses the address on the way back until sanded", async () => {
    const user = setup();
    await user.type(email(), "ana@example.com");
    await habit(user, "Go back");
    wait(900);
    expect(email()).toHaveValue("");

    await sand(user, "Go back");
    await user.type(email(), "ana@example.com");
    await habit(user, "Go back");
    wait(900);
    expect(email()).toHaveValue("ana@example.com");
  });

  it("keeps the address when sanded while away", async () => {
    const user = setup();
    await habit(user, "Go back");
    wait(900);
    expect(counter()).toBe("1/6");
    await user.type(email(), "ana@example.com");
    await habit(user, "Go back");
    // Sanded mid-trip: coming back must honour it.
    await sand(user, "Go back");
    wait(900);
    expect(email()).toHaveValue("ana@example.com");
  });

  it("wipes the address on an error until sanded", async () => {
    const user = setup();
    await habit(user, "Make it fail");
    await signUp(user, "ana@example.com");
    wait(400);
    expect(status()).toHaveTextContent("Something went wrong.");
    expect(email()).toHaveValue("");

    await sand(user, "Make it fail");
    await signUp(user, "ana@example.com");
    wait(400);
    expect(status()).toHaveTextContent("Your address is still here");
    expect(email()).toHaveValue("ana@example.com");
    expect(counter()).toBe("1/6");
  });

  it("opens on one habit with ?habit=", () => {
    setup({ habit: "paste" });
    expect(email()).toHaveValue(" Nubelson@Example.com ");
    // A one-shot press, not a toggle left on.
    expect(screen.getByRole("button", { name: "Paste" })).not.toHaveAttribute(
      "aria-pressed",
    );
    expect(screen.queryByRole("button", { name: "No mouse" })).toBeNull();
    expect(counter()).toBe("0/1");
  });

  it("lists a habit only once found with controls=off", async () => {
    const user = setup({ habit: "paste", controls: "off" });
    expect(screen.queryByRole("list", { name: "Habits" })).toBeNull();
    await user.click(screen.getAllByRole("button")[0]);
    expect(screen.queryByRole("button", { name: "Paste" })).toBeNull();
    await sand(user, "Paste");
    expect(
      screen.getByRole("button", { name: "Sanded: Paste" }),
    ).toBeInTheDocument();
  });
});

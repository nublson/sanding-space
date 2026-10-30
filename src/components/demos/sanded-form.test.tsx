import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { playSound } from "@/lib/sounds";
import SandedForm, { validate } from "./sanded-form";

vi.mock("@/lib/sounds", () => ({ playSound: vi.fn() }));

const VALID = {
  name: "Ana",
  email: "ana@example.com",
  phone: "+1 555 010 0199",
};

function forms() {
  render(<SandedForm name="sanded-form" params={{}} />);
  return {
    rough: screen.getByRole("group", { name: "Form A" }),
    sanded: screen.getByRole("form", { name: "Form B" }),
  };
}

beforeEach(() => vi.mocked(playSound).mockClear());
afterEach(() => vi.useRealTimers());

describe("validate", () => {
  it("accepts a spaced phone number only when sanded", () => {
    expect(validate(VALID, "sanded")).toEqual({});
    expect(validate(VALID, "rough")).toEqual({
      phone: "Enter 7 to 15 digits.",
    });
  });
});

describe("SandedForm", () => {
  it("links B's labels to their fields, not A's", async () => {
    const { rough, sanded } = forms();
    await userEvent.click(within(sanded).getByText("Email"));
    expect(
      within(sanded).getByRole("textbox", { name: "Email" }),
    ).toHaveFocus();
    await userEvent.click(within(rough).getByText("Email"));
    expect(
      within(rough).getByRole("textbox", { name: "Email" }),
    ).not.toHaveFocus();
  });

  it("blocks B's native submit until React hydrates", () => {
    // React's function-action guard: a native submit before hydration throws
    // instead of putting the fields in the URL.
    const { sanded } = forms();
    expect(sanded.getAttribute("action")).toMatch(/^javascript:/);
  });

  it("tabs through B in layout order and through A out of it", () => {
    const { rough, sanded } = forms();
    const order = (form: HTMLElement) =>
      within(form)
        .getAllByRole("textbox")
        .map((el) => el.getAttribute("name"));
    expect(order(sanded)).toEqual(["name", "email", "phone"]);
    expect(order(rough)).toEqual(["email", "phone", "name"]);
  });

  it("submits B on Enter; A ignores it", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { rough, sanded } = forms();
    for (const form of [rough, sanded]) {
      for (const [name, value] of Object.entries({
        ...VALID,
        phone: "15550100199",
      }))
        fireEvent.change(
          within(form).getByRole("textbox", { name: new RegExp(name, "i") }),
          {
            target: { value },
          },
        );
      fireEvent.keyDown(within(form).getByRole("textbox", { name: /phone/i }), {
        key: "Enter",
      });
    }
    fireEvent.submit(sanded);
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(within(sanded).getByText("You're signed up.")).toBeInTheDocument();
    expect(within(rough).queryByText(/signed up/i)).toBeNull();
  });

  it("keeps B's input, flags and focuses the first wrong field; A wipes all", async () => {
    const { rough, sanded } = forms();
    for (const form of [rough, sanded]) {
      await userEvent.type(
        within(form).getByRole("textbox", { name: "Name" }),
        "Ana",
      );
      await userEvent.type(
        within(form).getByRole("textbox", { name: "Email" }),
        "ana@",
      );
      await userEvent.click(
        within(form).getByRole("button", { name: "Sign up" }),
      );
    }
    const email = within(sanded).getByRole("textbox", { name: "Email" });
    expect(email).toHaveFocus();
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription(
      "Enter an email like ana@example.com.",
    );
    expect(within(sanded).getByRole("textbox", { name: "Name" })).toHaveValue(
      "Ana",
    );
    // Focus on the field reads its error; no second, form-level message.
    expect(within(sanded).getByRole("status")).toBeEmptyDOMElement();
    expect(within(rough).getByRole("textbox", { name: "Name" })).toHaveValue(
      "",
    );
    expect(
      within(rough).getByText("Something went wrong."),
    ).toBeInTheDocument();
    expect(playSound).toHaveBeenCalledWith("toggle-off");
  });

  it("sends B once however often it's clicked; A sends every click", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { rough, sanded } = forms();
    for (const form of [rough, sanded]) {
      for (const [name, value] of Object.entries({
        ...VALID,
        phone: "15550100199",
      }))
        fireEvent.change(
          within(form).getByRole("textbox", { name: new RegExp(name, "i") }),
          {
            target: { value },
          },
        );
      const button = within(form).getByRole("button", { name: "Sign up" });
      fireEvent.click(button);
      fireEvent.click(button);
    }
    // B's button stays focusable but reads as unavailable while it sends.
    expect(
      within(sanded).getByRole("button", { name: "Sign up" }),
    ).toHaveAttribute("aria-disabled", "true");
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(within(rough).getByText("Signed up 2 times.")).toBeInTheDocument();
    expect(within(sanded).getByText("You're signed up.")).toBeInTheDocument();
    expect(playSound).toHaveBeenCalledWith("tap");
  });

  it("annotates the differences with back=on", () => {
    render(<SandedForm name="sanded-form" params={{ back: "on" }} />);
    expect(
      screen.getByRole("button", { name: "Show the back" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("unlinked")).toBeVisible();
    expect(screen.getByText("linked")).toBeVisible();
  });

  it("switches the form a narrow frame shows with the verdicts", async () => {
    forms();
    const card = (name: string) =>
      screen.getByRole(name === "Form A" ? "group" : "form", { name })
        .parentElement as HTMLElement;
    const a = screen.getByRole("button", { name: "Form A, wrong" });
    const b = screen.getByRole("button", { name: "Form B, right" });
    expect(a).toHaveAttribute("aria-pressed", "true");
    expect(card("Form B")).toHaveClass("@max-lg:hidden");
    await userEvent.click(b);
    expect(b).toHaveAttribute("aria-pressed", "true");
    expect(a).toHaveAttribute("aria-pressed", "false");
    expect(card("Form A")).toHaveClass("@max-lg:hidden");
    expect(card("Form B")).not.toHaveClass("@max-lg:hidden");
    // Pressing the shown one again keeps it shown.
    await userEvent.click(b);
    expect(b).toHaveAttribute("aria-pressed", "true");
  });

  it("hides the toggle with controls=off", () => {
    render(<SandedForm name="sanded-form" params={{ controls: "off" }} />);
    expect(screen.queryByRole("button", { name: "Show the back" })).toBeNull();
  });
});

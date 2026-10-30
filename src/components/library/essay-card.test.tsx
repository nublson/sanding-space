import { render, screen } from "@testing-library/react";
import { EssayCard } from "@/components/library/essay-card";
import type { Essay } from "@/lib/content/types";

vi.mock("@/components/stage/live-thumbnail", () => ({
  LiveThumbnail: () => <div data-testid="thumb" />,
  demoThumbnail: (demo: string | null) =>
    demo === "with-thumbnail"
      ? () => <div data-testid="static-thumb" />
      : undefined,
}));

const essay = (o: Partial<Essay>): Essay => ({
  id: "e",
  slug: "button-press",
  title: "Button press",
  summary: "Sum",
  status: "Published",
  order: 1,
  sectionId: "s",
  coverDemo: "button-press-scale",
  tags: [],
  published: null,
  updated: "2026-01-01",
  relatedIds: [],
  ...o,
});

describe("EssayCard", () => {
  it("renders a Soon essay without a link", () => {
    render(<EssayCard essay={essay({ status: "Soon" })} />);
    expect(screen.queryByRole("link")).toBeNull();
  });
  it("labels a Soon card's stage, out of the accessibility tree", () => {
    render(<EssayCard essay={essay({ status: "Soon" })} />);
    const label = screen.getByText("Soon");
    expect(label.closest("[aria-hidden='true']")).not.toBeNull();
  });
  it("draws a Soon essay's static thumbnail, never its live demo", () => {
    render(
      <EssayCard
        essay={essay({ status: "Soon", coverDemo: "with-thumbnail" })}
      />,
    );
    expect(screen.getByTestId("static-thumb")).toBeInTheDocument();
    expect(screen.queryByTestId("thumb")).toBeNull();
  });
  it("leaves a Soon essay's stage empty without a static thumbnail", () => {
    render(<EssayCard essay={essay({ status: "Soon" })} />);
    expect(screen.queryByTestId("static-thumb")).toBeNull();
    expect(screen.queryByTestId("thumb")).toBeNull();
  });
  it("links a Published essay", () => {
    render(<EssayCard essay={essay({})} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/button-press");
    expect(link).toHaveAttribute("data-sound", "page");
  });
  it("names a Soon essay as coming soon for screen readers only", () => {
    render(
      <EssayCard
        essay={essay({ status: "Soon", title: "Every State Is Designed" })}
      />,
    );
    // jsdom drops the space between the two inline text nodes; browsers keep it.
    const heading = screen.getByRole("heading", {
      name: /^Every State Is Designed ?\(coming soon\)$/,
    });
    expect(heading.querySelector(".sr-only")).toHaveTextContent("coming soon");
  });
});

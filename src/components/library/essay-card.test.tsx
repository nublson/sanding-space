import { render, screen } from "@testing-library/react";
import { EssayCard } from "@/components/library/essay-card";
import type { Essay } from "@/lib/content/types";

vi.mock("@/components/stage/live-thumbnail", () => ({
  LiveThumbnail: () => <div data-testid="thumb" />,
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
    expect(screen.queryByText("Soon")).toBeNull();
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

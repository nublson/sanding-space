import { render, screen } from "@testing-library/react";
import { SectionBlock } from "@/components/library/section-block";
import type { Essay, LibrarySection } from "@/lib/content/types";

vi.mock("@/components/stage/live-thumbnail", () => ({
  LiveThumbnail: ({ essaySlug }: { essaySlug: string }) => (
    <div data-testid="thumb">{essaySlug}</div>
  ),
  demoThumbnail: () => undefined,
}));

const essay = (o: Partial<Essay>): Essay => ({
  id: "e",
  slug: "e",
  title: "E",
  summary: "",
  status: "Published",
  order: 1,
  sectionId: "s",
  coverDemo: null,
  tags: [],
  published: null,
  updated: "2026-01-01",
  relatedIds: [],
  ...o,
});
const section = (essays: Essay[]): LibrarySection => ({
  id: "s",
  slug: "interaction",
  name: "Interaction",
  question: "Q",
  order: 1,
  visible: true,
  essays,
});

describe("SectionBlock", () => {
  it("puts essay titles one heading level below the section heading", () => {
    render(
      <SectionBlock
        section={section([
          essay({ id: "a", slug: "a", title: "Featured" }),
          essay({ id: "b", slug: "b", title: "Card", status: "Soon" }),
        ])}
        intro={null}
        headingLevel={1}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Interaction",
    );
    const titles = screen.getAllByRole("heading", { level: 2 });
    expect(titles).toHaveLength(2);
    expect(titles[0]).toHaveTextContent("Featured");
    expect(titles[1]).toHaveTextContent("Card");
  });

  it("shows the featured essay once, not again in the grid", () => {
    render(
      <SectionBlock
        section={section([
          essay({ id: "a", slug: "a", title: "Alpha" }),
          essay({ id: "b", slug: "b", title: "Beta", order: 2 }),
        ])}
        intro={<p>Intro</p>}
      />,
    );
    expect(screen.getAllByText("Alpha")).toHaveLength(1);
    expect(screen.getAllByText("Beta")).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute(
      "data-section",
      "interaction",
    );
  });
  it("renders an empty grid when only the featured essay exists", () => {
    render(
      <SectionBlock
        section={section([essay({ id: "a", slug: "a", title: "Alpha" })])}
        intro={null}
      />,
    );
    expect(screen.getAllByText("Alpha")).toHaveLength(1);
  });
});

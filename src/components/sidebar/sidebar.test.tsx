import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/sidebar/sidebar";
import type { Essay, LibrarySection } from "@/lib/content/types";

const essay = (o: Partial<Essay>): Essay => ({
  id: "e",
  slug: "e",
  title: "E",
  summary: "",
  status: "Published",
  order: 1,
  sectionId: null,
  coverDemo: null,
  tags: [],
  published: null,
  updated: "2026-01-01",
  relatedIds: [],
  ...o,
});

const sections: LibrarySection[] = [
  {
    id: "s1",
    slug: "principles",
    name: "Principles",
    question: "What matters?",
    order: 1,
    visible: true,
    essays: [essay({ id: "p1", slug: "taste", title: "Taste" })],
  },
  {
    id: "s2",
    slug: "interaction",
    name: "Interaction",
    question: "How should it respond?",
    order: 2,
    visible: true,
    essays: [
      essay({ id: "e1", slug: "button-press", title: "Button press" }),
      essay({
        id: "e2",
        slug: "hover-intent",
        title: "Hover intent",
        status: "Soon",
      }),
    ],
  },
];

const setup = (
  section: string | null = "interaction",
  essaySlug: string | null = null,
) =>
  render(
    <Sidebar
      sections={sections}
      currentSectionSlug={section}
      currentEssaySlug={essaySlug}
      footer={<a href="/about">About</a>}
    />,
  );

describe("Sidebar", () => {
  it("collapsed sections link to their section page and hide their essays", () => {
    setup();
    expect(screen.getByRole("link", { name: "Principles" })).toHaveAttribute(
      "href",
      "/sections/principles",
    );
    expect(screen.queryByRole("link", { name: "Taste" })).toBeNull();
  });

  it("current section shows its question and essays", () => {
    setup();
    expect(screen.getByText("How should it respond?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Button press" })).toHaveAttribute(
      "href",
      "/button-press",
    );
  });

  it("soon essays are plain text", () => {
    setup();
    expect(screen.getByText("Hover intent")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Hover intent" })).toBeNull();
  });

  it("current essay is marked", () => {
    setup("interaction", "button-press");
    expect(screen.getByRole("link", { name: "Button press" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("wordmark links home", () => {
    setup();
    expect(screen.getByRole("link", { name: "Sanding Space" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});

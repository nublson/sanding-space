import { render, screen } from "@testing-library/react";
import { CurrentSidebar } from "@/components/sidebar/current-sidebar";
import type { LibrarySection } from "@/lib/content/types";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("@/components/sidebar/sidebar", () => ({
  Sidebar: (p: {
    introductionCurrent: boolean;
    currentSectionSlug: string | null;
    currentEssaySlug: string | null;
  }) => (
    <div
      data-testid="sidebar"
      data-introduction={String(p.introductionCurrent)}
      data-section={p.currentSectionSlug ?? ""}
      data-essay={p.currentEssaySlug ?? ""}
    />
  ),
}));

const section = (slug: string, essaySlugs: string[]): LibrarySection => ({
  id: slug,
  slug,
  name: slug,
  question: "",
  order: 1,
  visible: true,
  essays: essaySlugs.map((s) => ({
    id: s,
    slug: s,
    title: s,
    summary: "",
    status: "Published" as const,
    order: 1,
    sectionId: slug,
    coverDemo: null,
    tags: [],
    published: null,
    updated: "2026-01-01",
    relatedIds: [],
  })),
});

const sections = [
  section("principles", ["taste"]),
  section("interaction", ["button-press"]),
];

describe("CurrentSidebar", () => {
  it("on /introduction, marks the Introduction and expands no section", () => {
    pathname = "/introduction";
    render(<CurrentSidebar sections={sections} footer={null} />);
    const el = screen.getByTestId("sidebar");
    expect(el).toHaveAttribute("data-introduction", "true");
    expect(el).toHaveAttribute("data-section", "");
    expect(el).toHaveAttribute("data-essay", "");
  });

  it("on an essay page, derives section and essay from the URL", () => {
    pathname = "/button-press";
    render(<CurrentSidebar sections={sections} footer={null} />);
    const el = screen.getByTestId("sidebar");
    expect(el).toHaveAttribute("data-introduction", "false");
    expect(el).toHaveAttribute("data-section", "interaction");
    expect(el).toHaveAttribute("data-essay", "button-press");
  });

  it("on a section page, derives the section from the URL", () => {
    pathname = "/sections/principles";
    render(<CurrentSidebar sections={sections} footer={null} />);
    const el = screen.getByTestId("sidebar");
    expect(el).toHaveAttribute("data-section", "principles");
    expect(el).toHaveAttribute("data-essay", "");
  });
});

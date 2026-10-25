import { act, render, screen } from "@testing-library/react";
import { ScrollSpy } from "@/components/sidebar/scroll-spy";
import type { LibrarySection } from "@/lib/content/types";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("@/components/sidebar/sidebar", () => ({
  Sidebar: (p: {
    currentSectionSlug: string | null;
    currentEssaySlug: string | null;
  }) => (
    <div
      data-testid="sidebar"
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

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;
let callback: Callback;
const observed: Element[] = [];

beforeEach(() => {
  pathname = "/";
  observed.length = 0;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: Callback) {
        callback = cb;
      }
      observe(el: Element) {
        observed.push(el);
      }
      disconnect() {}
      unobserve() {}
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

function addHeadings() {
  for (const s of sections) {
    const h = document.createElement("h2");
    h.dataset.section = s.slug;
    document.body.append(h);
  }
}

describe("ScrollSpy", () => {
  it("on the index, follows the heading the observer reports", () => {
    addHeadings();
    render(<ScrollSpy sections={sections} footer={null} />);
    expect(screen.getByTestId("sidebar")).toHaveAttribute(
      "data-section",
      "principles",
    );
    const target = observed.find(
      (e) => (e as HTMLElement).dataset.section === "interaction",
    );
    act(() => callback([{ isIntersecting: true, target }]));
    expect(screen.getByTestId("sidebar")).toHaveAttribute(
      "data-section",
      "interaction",
    );
    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-essay", "");
  });

  it("on an essay page, derives section and essay from the URL", () => {
    pathname = "/button-press";
    render(<ScrollSpy sections={sections} footer={null} />);
    const el = screen.getByTestId("sidebar");
    expect(el).toHaveAttribute("data-section", "interaction");
    expect(el).toHaveAttribute("data-essay", "button-press");
  });

  it("on a section page, derives the section from the URL", () => {
    pathname = "/sections/principles";
    render(<ScrollSpy sections={sections} footer={null} />);
    const el = screen.getByTestId("sidebar");
    expect(el).toHaveAttribute("data-section", "principles");
    expect(el).toHaveAttribute("data-essay", "");
  });
});

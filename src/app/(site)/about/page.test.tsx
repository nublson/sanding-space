import { render, screen } from "@testing-library/react";
import { getAbout, getLibrary } from "@/lib/content/notion";
import AboutPage, { generateMetadata } from "./page";

process.env.NOTION_INTRODUCTION_PAGE_ID =
  "405b1726-8ab3-81f0-9d46-ef735904da9e";
process.env.NOTION_ABOUT_PAGE_ID = "00000000-0000-0000-0000-00000000ab07";

vi.mock("@/lib/content/notion", () => ({
  getAbout: vi.fn(),
  getLibrary: vi.fn(),
}));

describe("about page", () => {
  it("takes its heading and title from the Notion page", async () => {
    vi.mocked(getAbout).mockResolvedValue({
      title: "Colophon",
      lastEditedTime: "2026-01-01T00:00:00.000Z",
      blocks: [],
    });
    vi.mocked(getLibrary).mockResolvedValue({
      sections: [],
      bySlug: new Map(),
    });
    expect((await generateMetadata()).title).toEqual({
      absolute: "Colophon · Sanding Space",
    });
    render(await AboutPage());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Colophon",
    );
  });
});

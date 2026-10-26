import { render, screen, within } from "@testing-library/react";
import { getResources } from "@/lib/content/notion";
import type { Resources } from "@/lib/content/resources";
import ResourcesPage, { generateMetadata } from "./page";

vi.mock("@/lib/content/notion", () => ({ getResources: vi.fn() }));

const resources: Resources = {
  intro: "Tools and references I keep coming back to.",
  categories: [
    {
      id: "learning",
      name: "Learning",
      resources: [
        {
          id: "r1",
          name: "Devouring Details",
          url: "https://devouringdetails.com",
          description: "Rauno Freiberg's interaction design course.",
          order: 1,
        },
        {
          id: "r2",
          name: "animations.dev",
          url: "https://animations.dev",
          description: "Emil Kowalski's course on web animations.",
          order: 2,
        },
      ],
    },
    {
      id: "inspiration",
      name: "Inspiration",
      resources: [
        {
          id: "r3",
          name: "Craft",
          url: "https://craft.gustavofior.com",
          description: "",
          order: 1,
        },
      ],
    },
  ],
};

beforeEach(() => {
  vi.mocked(getResources).mockResolvedValue(resources);
});

describe("resources page", () => {
  it("is titled Resources and describes itself with the intro", async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toEqual({ absolute: "Resources · Sanding Space" });
    expect(metadata.description).toBe(resources.intro);
    expect(metadata.alternates?.canonical).toBe(
      "https://sanding.space/resources",
    );
  });

  it("lists every category and its resources as external links", async () => {
    render(await ResourcesPage());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Resources",
    );
    expect(screen.getByText(resources.intro)).toBeInTheDocument();

    const categories = screen.getAllByRole("heading", { level: 2 });
    expect(categories.map((h) => h.textContent)).toEqual([
      "Learning",
      "Inspiration",
    ]);

    const learning = screen.getByRole("region", { name: "Learning" });
    const links = within(learning).getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "https://devouringdetails.com",
      "https://animations.dev",
    ]);
    expect(links[0]).toHaveAttribute("target", "_blank");
    expect(links[0]).toHaveAttribute("rel", "noopener noreferrer");
    expect(links[0]).toHaveAccessibleName(
      "Devouring Details Rauno Freiberg's interaction design course. (opens in a new tab)",
    );
  });

  it("shows the destination's favicon and copes without a description", async () => {
    render(await ResourcesPage());
    const craft = screen.getByRole("link", { name: /^Craft/ });
    expect(craft).toHaveAccessibleName("Craft (opens in a new tab)");
    const icon = craft.querySelector("img");
    expect(icon).toHaveAttribute("alt", "");
    expect(icon).toHaveAttribute(
      "src",
      "/api/favicon?host=craft.gustavofior.com",
    );
  });

  it("falls back to the site description without an intro", async () => {
    vi.mocked(getResources).mockResolvedValue({ intro: "", categories: [] });
    expect((await generateMetadata()).description).toContain("Short essays");
    render(await ResourcesPage());
    expect(screen.queryAllByRole("heading", { level: 2 })).toHaveLength(0);
  });
});

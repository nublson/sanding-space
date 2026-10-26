import { render, screen, within } from "@testing-library/react";
import { PLACEHOLDER_RESOURCES } from "@/lib/content/resources";
import ResourcesPage, { generateMetadata } from "./page";

describe("resources page", () => {
  it("is titled Resources and describes itself with the intro", async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toEqual({ absolute: "Resources · Sanding Space" });
    expect(metadata.description).toBe(PLACEHOLDER_RESOURCES.intro);
    expect(metadata.alternates?.canonical).toBe(
      "https://sanding.space/resources",
    );
  });

  it("lists every category and its resources as external links", async () => {
    render(await ResourcesPage());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Resources",
    );
    expect(screen.getByText(PLACEHOLDER_RESOURCES.intro)).toBeInTheDocument();

    const categories = screen.getAllByRole("heading", { level: 2 });
    expect(categories.map((h) => h.textContent)).toEqual(
      PLACEHOLDER_RESOURCES.categories.map((c) => c.name),
    );

    for (const category of PLACEHOLDER_RESOURCES.categories) {
      const section = screen.getByRole("region", { name: category.name });
      const links = within(section).getAllByRole("link");
      expect(links).toHaveLength(category.resources.length);
      category.resources.forEach((resource, i) => {
        const link = links[i];
        expect(link).toHaveAttribute("href", resource.url);
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
        expect(link).toHaveAccessibleName(
          `${resource.name} ${resource.description} (opens in a new tab)`,
        );
      });
    }
  });

  it("shows the destination's favicon before each name", async () => {
    render(await ResourcesPage());
    const craft = screen.getByRole("link", { name: /^Craft / });
    const icon = craft.querySelector("img");
    expect(icon).toHaveAttribute("alt", "");
    expect(icon).toHaveAttribute(
      "src",
      "/api/favicon?host=craft.gustavofior.com",
    );
  });
});

import { cleanup, render, screen } from "@testing-library/react";
import type { LinkProps } from "notionic";
import { SiteLink } from "./site-link";

const ICON = "data:image/png;base64,iVBORw0KGgo=";
const context = { pageHref: () => null, headings: [], components: {} };

function renderLink(props: Partial<LinkProps> & { href: string }) {
  const { href, ...rest } = props;
  cleanup();
  render(
    <SiteLink
      link={{ href, external: /^https?:/.test(href) }}
      context={context}
      {...rest}
    >
      text
    </SiteLink>,
  );
  return screen.getByRole("link");
}

describe("SiteLink", () => {
  it("shows the favicon notionic fetched before an external link", () => {
    const link = renderLink({ href: "https://notionic.dev", favicon: ICON });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link.querySelector("img")).toHaveAttribute("src", ICON);
    expect(link).toHaveAccessibleName(/^text ?\(opens in a new tab\)$/);
  });

  it("shows a globe for a site without a favicon", () => {
    const link = renderLink({ href: "https://example.com", favicon: null });
    expect(link.querySelector("img")).toBeNull();
    expect(link.querySelector("svg")).not.toBeNull();
  });

  it("shows no icon for links to this site or on this site", () => {
    const own = renderLink({
      href: "https://sanding.space/about",
      favicon: ICON,
    });
    expect(own.querySelector("img, svg")).toBeNull();
    const path = renderLink({ href: "/introduction" });
    expect(path.querySelector("img, svg")).toBeNull();
    expect(path).not.toHaveAttribute("target");
  });
});

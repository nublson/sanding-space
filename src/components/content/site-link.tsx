import { LinkFavicon, type LinkProps } from "notionic";
import { hostOf } from "@/lib/favicon";
import { SITE_URL } from "@/lib/site";

// notionic's link styling, with the foreground ink for links (spec §10).
const LINK_CLASSES =
  "rounded-sm font-medium text-foreground underline decoration-muted-foreground/50 decoration-from-font underline-offset-4 transition-[text-decoration-color] hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const SITE_HOST = hostOf(SITE_URL);

/**
 * Links inside Notion text. External links open in a new tab and carry the
 * destination's favicon before the text (as `fetchBlocks` attached it, or a
 * muted globe for a site without one), so a reader sees where a link goes
 * before following it. Links to this site show no icon.
 */
export function SiteLink({ link, favicon, children }: LinkProps) {
  const ownSite = link.external && hostOf(link.href) === SITE_HOST;
  return (
    <a
      href={link.href}
      {...(link.external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className={LINK_CLASSES}
    >
      <LinkFavicon favicon={ownSite ? undefined : favicon} />
      {children}
      {link.external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}

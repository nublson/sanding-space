import type { LinkProps } from "notionic";
import { faviconUrl, hostOf } from "@/lib/favicon";
import { SITE_URL } from "@/lib/site";

// notionic's link styling, with the foreground ink for links (spec §10).
const LINK_CLASSES =
  "rounded-sm font-medium text-foreground underline decoration-muted-foreground/50 decoration-from-font underline-offset-4 transition-[text-decoration-color] hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const SITE_HOST = hostOf(SITE_URL);

/**
 * Links inside Notion text. External links open in a new tab and carry the
 * destination's favicon before the text, so a reader sees where a link goes
 * before following it. Links to this site show no icon.
 */
export function SiteLink({ link, children }: LinkProps) {
  const host = link.external ? hostOf(link.href) : null;
  const icon = host && host !== SITE_HOST ? faviconUrl(host) : null;
  return (
    <a
      href={link.href}
      {...(link.external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className={LINK_CLASSES}
    >
      {icon && (
        // biome-ignore lint/performance/noImgElement: a 14px icon from our own proxy; next/image adds nothing here
        <img
          src={icon}
          alt=""
          width={14}
          height={14}
          loading="lazy"
          decoding="async"
          className="me-1.5 inline-block size-3.5 rounded-[3px] align-[-2px]"
        />
      )}
      {children}
      {link.external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}

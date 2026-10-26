import type { BlockComponents } from "notionic";
import { SiteLink } from "@/components/content/site-link";
import { SiteDemoFrame } from "@/components/stage/demo-frame";

/**
 * Block overrides shared by every NotionRenderer on the site: demos in the
 * site frame, links with a favicon when external, linked databases (the
 * Essays view at the end of a section) and unsupported blocks render nothing.
 */
export const siteComponents: BlockComponents = {
  demo: SiteDemoFrame,
  link: SiteLink,
  child_database: () => null,
  unsupported: () => null,
};

import type { BlockComponents } from "notionic";
import { SiteDemoFrame } from "@/components/stage/demo-frame";

/**
 * Block overrides shared by every NotionRenderer on the site: demos in the
 * site frame, linked databases (the Essays view at the end of a section) and
 * unsupported blocks render nothing.
 */
export const siteComponents: BlockComponents = {
  demo: SiteDemoFrame,
  child_database: () => null,
  unsupported: () => null,
};

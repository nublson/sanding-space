import type { MetadataRoute } from "next";
import { ICON_BACKGROUND } from "@/components/brand/icon-tile";
import { INTRODUCTION } from "@/lib/introduction";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: INTRODUCTION.path,
    display: "standalone",
    background_color: ICON_BACKGROUND,
    theme_color: ICON_BACKGROUND,
    icons: [
      { src: "/icon2/192", sizes: "192x192", type: "image/png" },
      {
        src: "/icon2/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

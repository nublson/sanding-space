import { ImageResponse } from "next/og";
import { IconTile } from "@/components/brand/icon-tile";

// Home-screen and install icons for the web manifest. Full-bleed, like the
// Apple icon, so the 512 doubles as a maskable icon.
const SIZES = [192, 512] as const;

export function generateImageMetadata() {
  return SIZES.map((px) => ({
    id: String(px),
    contentType: "image/png",
    size: { width: px, height: px },
  }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const px = Number(await id);
  return new ImageResponse(<IconTile size={px} rounded={false} />, {
    width: px,
    height: px,
  });
}

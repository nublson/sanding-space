import { ImageResponse } from "next/og";
import { IconTile } from "@/components/brand/icon-tile";

// Home-screen icon. iOS rounds the corners itself, so the tile is full-bleed
// and the mark sits inside the safe area.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <IconTile size={size.width} rounded={false} />,
    size,
  );
}

import { ImageResponse } from "next/og";
import { IconTile } from "@/components/brand/icon-tile";

// PNG favicon for browsers that ignore SVG icons (Safari). icon0.svg is the
// vector version; favicon.ico is this same image wrapped for legacy requests.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<IconTile size={size.width} rounded />, size);
}

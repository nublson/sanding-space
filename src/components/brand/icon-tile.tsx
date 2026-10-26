/**
 * The app icon: the shaving mark (spec §10.1) on a silicon-carbide tile. One
 * drawing for every size, in sRGB hex because icon renderers and Satori don't
 * read OKLCH: background oklch(0.178) is #111111, foreground oklch(0.946) is
 * #ededed. The mark is scaled about the tile's centre and drawn with a heavier
 * stroke than the inline mark, so it survives 16px.
 *
 * `rounded` draws the favicon tile (corners of about 21%). The Apple icon is
 * full-bleed, since iOS applies its own mask, and keeps the mark inside the
 * safe area with a smaller scale.
 */
export const ICON_BACKGROUND = "#111111";
export const ICON_FOREGROUND = "#ededed";
export const MARK_PATH =
  "M8 34C6 18 26 6 37 15C46 23 38 37 27 35C19 33 20 22 28 23";

// The mark's visual centre in its own 48-unit box (bounding box of the curve).
const MARK_CENTER = { x: 25, y: 23.5 };

export function markTransform(scale: number): string {
  const x = 24 - MARK_CENTER.x * scale;
  const y = 24 - MARK_CENTER.y * scale;
  return `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale})`;
}

export function IconTile({
  size,
  rounded,
  scale = rounded ? 0.85 : 0.72,
}: {
  size: number;
  rounded: boolean;
  scale?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Sanding Space"
    >
      {/* Named by aria-label, not <title>: Satori paints a title as text. */}
      <rect
        width="48"
        height="48"
        rx={rounded ? 10 : 0}
        fill={ICON_BACKGROUND}
      />
      <path
        d={MARK_PATH}
        transform={markTransform(scale)}
        fill="none"
        stroke={ICON_FOREGROUND}
        strokeWidth={6}
        strokeLinecap="round"
      />
    </svg>
  );
}

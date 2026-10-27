import { ImageResponse } from "next/og";
import {
  ICON_BACKGROUND,
  ICON_FOREGROUND,
  MARK_PATH,
} from "@/components/brand/icon-tile";
import { SITE_NAME } from "@/lib/site";
import { loadGoogleFont } from "./fonts";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// The site's subtle token, oklch(0.64), in sRGB hex (Satori reads no OKLCH).
const SUBTLE = "#8c8c8c";

// Link previews often crop the card towards 1.6:1, shaving about 100px off
// each side, so nothing sits closer to the left or right edge than this.
const PAD_X = 120;
const PAD_Y = 88;

// Two type roles: the title, and one secondary size shared by the wordmark and
// the line above the title. Inter's own display tracking is about -0.022em.
const SECONDARY = { fontSize: 28, fontWeight: 500, letterSpacing: "-0.01em" };

/** Title size from length, so a long title still fits in three lines. */
function titleSize(title: string): number {
  const n = title.length;
  return n <= 24 ? 92 : n <= 40 ? 78 : n <= 64 ? 66 : 56;
}

// The dot field from the Surface demo: a 24px grid, one column on the text's
// left edge (PAD_X is a multiple of the step), easing out by row
// FIELD_FADE_ROWS so the title sits on clean ground.
const FIELD_STEP = 24;
const FIELD_COLUMNS = OG_SIZE.width / FIELD_STEP - 1;
const FIELD_FADE_ROWS = 20;
const FIELD_OPACITY = 0.3;
const FIELD = Array.from(
  { length: FIELD_FADE_ROWS * FIELD_COLUMNS },
  (_, i) => {
    const row = Math.floor(i / FIELD_COLUMNS);
    const col = i % FIELD_COLUMNS;
    return {
      x: (col + 1) * FIELD_STEP,
      y: FIELD_STEP / 2 + row * FIELD_STEP,
      opacity: FIELD_OPACITY * (1 - row / FIELD_FADE_ROWS) ** 2,
    };
  },
);

/**
 * One card for every page: the silicon-carbide surface under a dot field that
 * fades out towards the title, the wordmark in the top-left corner and the
 * title, large, in the bottom-left, with an optional muted line above it (a
 * section's question, an essay's section). Preview platforms print the page's
 * title and description beside the image, so the card carries nothing else.
 * Every title is set in Inter, essays included.
 */
export async function ogImage({
  title,
  eyebrow,
}: {
  title: string;
  eyebrow?: string;
}) {
  const interMedium = await loadGoogleFont(
    "Inter",
    500,
    `${SITE_NAME}${eyebrow ?? ""}${title}`,
  );

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: `${PAD_Y}px ${PAD_X}px`,
        background: ICON_BACKGROUND,
        color: ICON_FOREGROUND,
        fontFamily: "Inter",
      }}
    >
      {/* Satori draws no repeating CSS gradients, so the dots are SVG. */}
      <svg
        width={OG_SIZE.width}
        height={OG_SIZE.height}
        viewBox={`0 0 ${OG_SIZE.width} ${OG_SIZE.height}`}
        role="img"
        aria-label="A field of dots"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {FIELD.map((dot) => (
          <circle
            key={`${dot.x},${dot.y}`}
            cx={dot.x}
            cy={dot.y}
            r={1.6}
            fill={ICON_FOREGROUND}
            opacity={dot.opacity}
          />
        ))}
      </svg>

      {/* Wordmark, as in the sidebar. */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <svg
          width={34}
          height={34}
          viewBox="0 0 48 48"
          role="img"
          aria-label={SITE_NAME}
        >
          <path
            d={MARK_PATH}
            fill="none"
            stroke={SUBTLE}
            strokeWidth={5}
            strokeLinecap="round"
          />
        </svg>
        <div style={{ ...SECONDARY, color: SUBTLE }}>{SITE_NAME}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {eyebrow && (
          <div
            style={{
              maxWidth: 840,
              ...SECONDARY,
              lineHeight: 1.3,
              color: SUBTLE,
              textWrap: "balance",
            }}
          >
            {eyebrow}
          </div>
        )}
        <div
          style={{
            fontSize: titleSize(title),
            lineHeight: 1.1,
            fontWeight: 500,
            letterSpacing: "-0.022em",
            textWrap: "balance",
          }}
        >
          {title}
        </div>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "Inter", data: interMedium, weight: 500, style: "normal" },
      ],
    },
  );
}

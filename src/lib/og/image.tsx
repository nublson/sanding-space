import { ImageResponse } from "next/og";
import {
  ICON_BACKGROUND,
  ICON_FOREGROUND,
  MARK_PATH,
} from "@/components/brand/icon-tile";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { loadGoogleFont } from "./fonts";
import { type Bounds, pressPoint, surfaceFrame } from "./surface-frame";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// The site's achromatic tokens in sRGB hex (Satori reads no OKLCH):
// foreground oklch(0.946), subtle oklch(0.64).
const SUBTLE = "#8c8c8c";

const PAD = 72;
/** The demo at 2.1×: a 571-unit stage, with dots that read at feed size. */
const SCALE = 2.1;
/** Where a press may land: clear of the title column and the lockup. */
const PRESS_BOUNDS: Bounds = { x: [760, 1010], y: [170, 330] };
/** The title column, bottom-left. */
const COLUMN = 660;

/** Title size from length, so a long title still fits the column in three lines. */
function titleSize(title: string, serif: boolean): number {
  const n = title.length;
  const base = n <= 18 ? 80 : n <= 30 ? 66 : n <= 44 ? 56 : 46;
  return serif ? Math.round(base * 1.06) : base;
}

/** The field as one <svg>, which Satori rasterises in a single pass. */
function Field({ pressKey }: { pressKey: string }) {
  const { width, height } = OG_SIZE;
  const dots = surfaceFrame(
    width,
    height,
    SCALE,
    pressPoint(pressKey, PRESS_BOUNDS),
  );
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="The Surface demo, pressed"
    >
      {dots.map((p) => (
        <circle
          key={`${p.x},${p.y}`}
          cx={p.x.toFixed(1)}
          cy={p.y.toFixed(1)}
          r={((1.6 + p.d * 1.4) * SCALE).toFixed(2)}
          fill={ICON_FOREGROUND}
          fillOpacity={(0.3 + p.d * 0.65).toFixed(2)}
        />
      ))}
    </svg>
  );
}

/**
 * One card for every page: a frozen frame of the Surface demo, pressed where
 * the page's key says, with the wordmark top-left, the eyebrow and title
 * bottom-left and the domain bottom-right. Essays set the title in Newsreader
 * like the page; everything else uses Inter. The description stays in the
 * meta tags; the card carries the context in its eyebrow.
 */
export async function ogImage({
  eyebrow,
  title,
  serif = false,
  pressKey,
}: {
  eyebrow?: string;
  title: string;
  serif?: boolean;
  /** Seeds the press point: the page's slug or name, so each card is its own. */
  pressKey: string;
}) {
  const domain = SITE_URL.replace(/^https?:\/\//, "");
  const text = `${SITE_NAME}${domain}${eyebrow ?? ""}${title}`;
  const [inter, interMedium, newsreader] = await Promise.all([
    loadGoogleFont("Inter", 400, text),
    loadGoogleFont("Inter", 500, text),
    serif ? loadGoogleFont("Newsreader", 400, title) : null,
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: ICON_BACKGROUND,
        color: ICON_FOREGROUND,
        fontFamily: "Inter",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, display: "flex" }}>
        <Field pressKey={pressKey} />
      </div>

      {/* Fades the field under the text, so the title reads at feed size. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          display: "flex",
          background: `linear-gradient(100deg, ${ICON_BACKGROUND} 0%, rgba(17,17,17,0.9) 36%, rgba(17,17,17,0) 60%)`,
        }}
      />

      {/* Wordmark, top-left, as in the sidebar. */}
      <div
        style={{
          position: "absolute",
          top: PAD - 6,
          left: PAD,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <svg
          width={30}
          height={30}
          viewBox="0 0 48 48"
          role="img"
          aria-label={SITE_NAME}
        >
          <path
            d={MARK_PATH}
            fill="none"
            stroke={ICON_FOREGROUND}
            strokeWidth={5}
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.01em" }}
        >
          {SITE_NAME}
        </div>
      </div>

      {/* Eyebrow and title, bottom-left. */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          bottom: PAD - 4,
          width: COLUMN,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {eyebrow && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* The current-essay bar from the sidebar guide line. */}
            <div
              style={{ width: 3, height: 20, background: ICON_FOREGROUND }}
            />
            <div style={{ fontSize: 22, fontWeight: 500, color: SUBTLE }}>
              {eyebrow}
            </div>
          </div>
        )}
        <div
          style={{
            fontSize: titleSize(title, serif),
            lineHeight: 1.06,
            fontFamily: serif ? "Newsreader" : "Inter",
            fontWeight: serif ? 400 : 500,
            letterSpacing: serif ? "-0.015em" : "-0.025em",
            textWrap: "balance",
          }}
        >
          {title}
        </div>
      </div>

      {/* Domain, bottom-right. */}
      <div
        style={{
          position: "absolute",
          right: PAD,
          bottom: PAD - 8,
          fontSize: 22,
          color: SUBTLE,
        }}
      >
        {domain}
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "Inter", data: inter, weight: 400, style: "normal" },
        { name: "Inter", data: interMedium, weight: 500, style: "normal" },
        ...(newsreader
          ? [
              {
                name: "Newsreader",
                data: newsreader,
                weight: 400 as const,
                style: "normal" as const,
              },
            ]
          : []),
      ],
    },
  );
}

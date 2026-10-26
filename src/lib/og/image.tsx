import { ImageResponse } from "next/og";
import {
  ICON_BACKGROUND,
  ICON_FOREGROUND,
  MARK_PATH,
} from "@/components/brand/icon-tile";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { loadGoogleFont } from "./fonts";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// The site's achromatic tokens in sRGB hex (Satori reads no OKLCH):
// foreground oklch(0.946), muted oklch(0.7), subtle oklch(0.64),
// card oklch(0.218), border oklch(0.248).
const MUTED = "#9e9e9e";
const SUBTLE = "#8c8c8c";
const CARD = "#1a1a1a";
const BORDER = "#212121";

const PAD = 72;
const STAGE = 380;
const GAP = 56;
const COLUMN = OG_SIZE.width - PAD * 2 - STAGE - GAP;

/** Keep a description to one breath; the column has room for two lines. */
function clip(text: string, max = 110): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max).replace(/\s+\S*$/, "");
  return `${cut}…`;
}

/** Title size from length, so a long title still fits the column in three lines. */
function titleSize(title: string, serif: boolean): number {
  const n = title.length;
  const base = n <= 18 ? 84 : n <= 30 ? 68 : n <= 44 ? 58 : 48;
  return serif ? base + 4 : base;
}

/**
 * One card for every page, laid out like the site: a demo stage on the right
 * (the mark stands in until a demo screenshot can), the title and description
 * centred on the left, the wordmark and the domain in the corners. Essays set
 * the title in Newsreader like the page; everything else uses Inter.
 */
export async function ogImage({
  eyebrow,
  title,
  description,
  serif = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  serif?: boolean;
}) {
  const body = clip(description ?? "");
  const domain = SITE_URL.replace(/^https?:\/\//, "");
  const text = `${SITE_NAME}${domain}${eyebrow ?? ""}${title}${body}`;
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
        background: `radial-gradient(1100px 700px at 0% 0%, #171717 0%, ${ICON_BACKGROUND} 60%)`,
        color: ICON_FOREGROUND,
        fontFamily: "Inter",
      }}
    >
      {/* Wordmark, top-left, as in the sidebar. */}
      <div
        style={{
          position: "absolute",
          top: PAD - 8,
          left: PAD,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <svg
          width={32}
          height={32}
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
          style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.01em" }}
        >
          {SITE_NAME}
        </div>
      </div>

      {/* Domain, bottom-left. */}
      <div
        style={{
          position: "absolute",
          bottom: PAD - 12,
          left: PAD,
          fontSize: 24,
          color: SUBTLE,
        }}
      >
        {domain}
      </div>

      {/* Text column, vertically centred. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: PAD,
          width: COLUMN,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 18,
        }}
      >
        {eyebrow && (
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* The current-essay bar from the sidebar guide line. */}
            <div
              style={{ width: 3, height: 22, background: ICON_FOREGROUND }}
            />
            <div style={{ fontSize: 24, fontWeight: 500, color: SUBTLE }}>
              {eyebrow}
            </div>
          </div>
        )}
        <div
          style={{
            fontSize: titleSize(title, serif),
            lineHeight: 1.08,
            fontFamily: serif ? "Newsreader" : "Inter",
            fontWeight: serif ? 400 : 500,
            letterSpacing: serif ? "-0.015em" : "-0.025em",
            textWrap: "balance",
          }}
        >
          {title}
        </div>
        {body && (
          <div
            style={{
              fontSize: 27,
              lineHeight: 1.4,
              color: MUTED,
              textWrap: "pretty",
            }}
          >
            {body}
          </div>
        )}
      </div>

      {/* The demo stage: the site's card surface with the mark on it. */}
      <div
        style={{
          position: "absolute",
          top: (OG_SIZE.height - STAGE) / 2,
          right: PAD,
          width: STAGE,
          height: STAGE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 28,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.03) inset",
        }}
      >
        <svg
          width={236}
          height={236}
          viewBox="0 0 48 48"
          role="img"
          aria-label="The shaving mark"
        >
          <path
            d={MARK_PATH}
            fill="none"
            stroke={ICON_FOREGROUND}
            strokeWidth={5}
            strokeLinecap="round"
          />
        </svg>
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

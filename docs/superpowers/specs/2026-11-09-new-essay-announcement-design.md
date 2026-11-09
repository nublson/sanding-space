# Announcements: new essays and external promos

Date: 2026-11-09. Status: approved design, revised the same day to add external promos.

## Goal

One small slot announces one thing at a time without getting in the way of reading. By default it announces the newest essay. When the author sets up an external promo in Notion (another project, a magazine, a newsletter), that promo takes the slot instead, like loading.dev promoting Interfaces. On desktop the slot is a card in the sidebar footer; on mobile it's a bar floating above the bottom edge of the screen.

Prototype of the chosen treatments: https://claude.ai/artifact/KFH8ze9uEUDBziMhtfy5Ew (desktop sidebar card, mobile bottom bar; essay variant).

## Decisions

- **Two kinds of item.** The *essay* item is automatic: the newest essay with status `Published` and a `Published` date, for **14 days** after that date. *External* items come from a new Notion **Promotions** database.
- **External wins.** When an external promo is live, it takes the slot. Among several live promos, the one with the latest `Start` wins. The essay item shows when no external promo is live, or when the reader has closed it.
- **Readers can make it go away.** Closing an item (×) hides it for good; opening an essay hides its essay item ("read"). Remembered per item in `localStorage`, so closing a promo never hides the next new essay.
- **One item per page view.** After a close, nothing replaces it until the next navigation. Then the next eligible item, if any, appears. A second card popping up right after a close would feel like nagging.
- **Optional database.** Without `NOTION_PROMOTIONS_DATA_SOURCE_ID` the site behaves exactly as essays-only. Nothing breaks before the database exists.
- **Text plus a small icon.** Essay items: 6px foreground dot. External items: the destination's favicon, looked up like the Resources page's icons. No cover demo, so no demo JavaScript ships with every page.
- **Desktop: sidebar card. Mobile: bottom bar, and only the bar.** Below md the sidebar card is not shown, not even when the mobile sidebar is open, so an item never appears twice. Rejected: a banner above the content on any size, because it can only appear after the client checks storage, which shifts the essay down after load; a dot on the mobile sidebar toggle, judged too quiet.
- **Monochrome.** Site tokens only. No accent hue (§10.2). A favicon keeps its own colors, as on the Resources page.

## Content: the Promotions database

New Notion database, env `NOTION_PROMOTIONS_DATA_SOURCE_ID` (optional). Properties:

| Property | Type | Notes |
|---|---|---|
| Name | title | The card's headline, e.g. "Interfaces". Required. |
| Description | text | One line, e.g. "A magazine about design engineering." |
| URL | url | Where the card goes, in a new tab. Required. |
| Active | checkbox | Required for the promo to run. |
| Start | date | Optional. Runs from 00:00 UTC that day. Empty: already started. |
| End | date | Optional, inclusive. Runs until 00:00 UTC the day after. Empty: no end. |

A row is a candidate when `Active` is ticked and it has a Name and a URL. Candidates sort by `Start`, latest first; an empty `Start` sorts last. Ties go to the name.

**Revised 2026-11-09:** promos have no Label column. A short Name and a one-line Description say what a promo is; the mobile bar shows the Description under the Name (an essay's bar keeps "New essay" over its title).

## Data flow

The server can't read the clock: with `cacheComponents`, `new Date()` while the layout prerenders fails the build. So the server builds an ordered list and the browser picks.

**Server** (`src/lib/content/announcement.ts`, pure):

```ts
type AnnouncementItem = {
  kind: "essay" | "external";
  id: string;          // essay slug, or the promo's Notion page id
  title: string;
  summary: string;     // essay Summary, or promo Description
  href: string;        // "/<slug>", or the promo URL
  label: string | null; // "New essay" for essays; null for promos
  icon: string | null; // favicon data URL for external items; null for essays
  startsAt: string | null;  // ISO; null = already started
  expiresAt: string | null; // ISO; null = no end
};
```

- `essayAnnouncement(library)`: the newest Published essay with a date. Ties go to the section first by `Order`, then the essay first by `Order`. `published` is read as 00:00 UTC that day. `startsAt: null`, `expiresAt` = published + `ANNOUNCE_DAYS` (14) days. The library has already resolved `Preview` through `showPreviews()`, so a Preview essay counts everywhere except Vercel production.
- `promotionAnnouncement(promotion)`: maps a promo to an item. `startsAt` = Start at 00:00 UTC, `expiresAt` = End + 1 day at 00:00 UTC.
- `announcementItems(library, promotions)`: the promos in order, then the essay item if any.
- `isLive(item, now)`: `(startsAt === null || now >= startsAt) && (expiresAt === null || now < expiresAt)`.

**Notion** (`src/lib/content/notion.ts`): `getPromotions()` (`"use cache"`, tag `notion`, `cacheLife("minutes")`). It returns `[]` without the env variable. Otherwise it queries the data source, parses rows with `parsePromotion` (`parse.ts`), keeps and sorts candidates (`selectPromotions`), and adds each URL's favicon with `fetchLinkFavicon` (the Resources page's lookup and options). Edits in Notion show up within minutes through the existing cache tag and revalidation, with no deploy.

**Layout**: `announcementItems(await getLibrary(), await getPromotions())`, passed down as a prop. Expired items stay in the list until Notion changes; the browser never shows them. That costs a few hundred bytes.

## When it shows (browser)

`useAnnouncement(items)` picks the first item that:

1. is live (`isLive(item, Date.now())`);
2. has no entry in storage (neither closed nor read);
3. is not an essay item whose page is the current path.

Storage: `localStorage["sanding-space:announcement"]` holds a JSON object `{ [id]: "dismissed" | "read" }`, at most 50 entries (oldest dropped). Reads and writes are in try/catch. If storage is unavailable, an in-memory copy keeps closes for the visit.

**Marked read**: when the path is an essay item's page, `read` is written for its slug, by any route (the card, the sidebar, a link, a direct visit). External items are never marked read; only closing hides them.

**One per page view**: the choice is made after mount and again on each path change, never right after a close.

**Shared state**: both treatments are mounted at every width (CSS hides one), so they share one module-level store through `useSyncExternalStore`. A close in one is a close in the other.

**No flash, no shift**: the server renders nothing visible (phase `pending`: `opacity: 0`, `inert`, `aria-hidden`). After mount, the hook either drops it (`hidden`) or fades it in (`shown`). Neither treatment takes space in the content flow, so appearing and disappearing never move the essay.

## Desktop: sidebar card (md and up)

- Lives in the sidebar footer, above Resources and About, in the pinned area. Its height comes out of the scrolling list above it, never out of the content.
- Layout: 1px `border` on `card`, radius 10px, padding 10px 12px 12px.
  - Two columns: a 1rem marker column, then one text column holding the label (12/18, `subtle-foreground`), the title (`foreground`, 500) and the summary clamped to two lines (13/19, `muted-foreground`), all on one left edge (revised 2026-11-09, "hanging icon").
  - The marker sits on the line it belongs to: an essay's 6px dot on the "New essay" line, a promo's 16px favicon (radius 4px) on the title's line. Each marker cell is one line of its neighbour's text tall, so they share a center.
- The whole card except the close button is one link with `data-sound="page"`:
  - Essay: a `Link` to `/<slug>`.
  - External: an `<a href={url} target="_blank" rel="noopener">`.
- Hover: border goes to `input`, 150ms `--ease-out`.
- Close: 28px icon button in the top-right corner, lucide `X` 16px, `data-sound="tap"`, from `src/components/ui/`. It sits outside the link, never nested.
- Hidden below md (`max-md:hidden`).
- The `Sidebar` component gets an optional `announcement` slot rendered above the footer row.

## Mobile: bottom bar (below md)

- Fixed to the viewport: `left`/`right` 12px plus `env(safe-area-inset-left/right)`, `bottom` 16px plus `env(safe-area-inset-bottom)`. Height 56px, radius 12px, 1px border one step lighter than `border`, background one step above `card`. No shadow.
- Content: the marker, a two-line stack (label 12/18 `subtle-foreground`, title `foreground` 500 truncated), the action, and a 36px close button (44px on coarse pointers). The action is `Read` + lucide `ArrowRight` for essays, `Visit` + lucide `ArrowUpRight` for external items, 14px.
- Mounted outside the shell's translated track. A `position: fixed` element inside a transformed ancestor would move with it, so `MobileShell` gets an `overlay` slot rendered after the track.
- While the sidebar is open the bar fades out and is inert.
- `md:hidden`.
- `main`'s mobile bottom padding becomes `6rem + env(safe-area-inset-bottom)`, so the last paragraph can scroll clear of the bar.

## Motion and sound

- Appear: opacity 0 → 1 and `translateY(8px)` → 0, 300ms `--ease-out`. Close: the reverse, 200ms, then unmount. CSS transitions only (no `motion/react` in site chrome).
- Reduced motion: no translate, no duration.
- Sounds: `page` on the link, `tap` on close. Nothing on appear.

## Accessibility

- Each treatment is a `role="region"` labeled with the item's label ("New essay" for essays, "Announcement" for promos). No live region, so appearing on load doesn't interrupt a screen reader.
- Link accessible name: `<label>: <title>`; external links add `(opens in a new tab)`.
- Close button: `aria-label="Dismiss <title>"` for both kinds.
- After a close, focus moves to the Resources link on desktop and `#main-content` on mobile.
- Hidden states are `inert` + `aria-hidden`, not just transparent.
- Favicons are decorative (`alt=""`).

## Files

| File | Change |
|---|---|
| `src/lib/content/announcement.ts` (+ test) | New: `ANNOUNCE_DAYS`, `AnnouncementItem`, `essayAnnouncement`, `promotionAnnouncement`, `announcementItems`, `isLive` |
| `src/lib/content/types.ts` | `Promotion` type |
| `src/lib/content/parse.ts` (+ test) | `parsePromotion` |
| `src/lib/content/promotions.ts` (+ test) | `selectPromotions` |
| `src/lib/content/notion.ts` | `getPromotions()` |
| `src/components/announcement/use-announcement.ts` (+ test) | Client hook and store |
| `src/components/announcement/sidebar-card.tsx` (+ test) | Desktop card |
| `src/components/announcement/bottom-bar.tsx` (+ test) | Mobile bar |
| `src/components/announcement/announcement-link.tsx` | Shared link: `Link` for essays, `<a target="_blank">` for external items |
| `src/components/sidebar/sidebar.tsx`, `current-sidebar.tsx` | `announcement` slot |
| `src/components/sidebar/mobile-shell.tsx` (+ test) | `overlay` slot |
| `src/app/(site)/layout.tsx` | Builds the items, passes them to both slots, `main` padding |
| `docs/spec.md` | §3.5 Promotions database, env list, §9.1 and §9.5 |
| `AGENTS.md` | Env list and Interface layout line |

## Testing

Unit:
- Essay item: newest Published with a date; ignores Soon and undated essays; tie-break; `expiresAt` = +14 days; empty library returns none.
- Promotion item: Start and End boundaries (End inclusive), default label, missing dates.
- `announcementItems`: promos first, then the essay.
- `isLive`: before Start, on day 13, from day 14, after End.
- `parsePromotion`: every property, missing columns.
- `selectPromotions`: drops inactive rows and rows without a name or URL; sorts by Start, latest first, empty last.

Hook and components:
- Pending before mount; shown after.
- External beats essay; a closed external lets the essay show on the next path, not immediately.
- Expired items are skipped.
- Close persists per id; a closed promo doesn't hide a newer essay.
- Visiting the essay page marks it read.
- Storage that throws: still renders, close still works.
- External link has `target="_blank"` and "(opens in a new tab)" in its name; essay link doesn't.
- Close button is never inside the link.
- Bottom bar is inert while the shell is open, and rendered outside the track.

Manual: real phone with a home indicator, VoiceOver, reduced motion, a real Promotions row with Start and End, and Lighthouse on an essay page (Accessibility 100, CLS 0).

## Out of scope

- Several items at once, or a "what's new" list.
- RSS, email or push notifications.
- Hand-picking an essay (an external promo pointing at a sanding.space URL works, but is treated as external).
- Analytics on closes or clicks.
- Images beyond the favicon.

# New essay announcement

Date: 2026-11-09. Status: approved design, awaiting spec review.

## Goal

Tell returning readers that a new essay has been published, without getting in the way of reading. On desktop a small card sits in the sidebar footer; on mobile a bar floats above the bottom edge of the screen. Both point at the same essay and go away under the same rules.

Prototype of the chosen treatments: https://claude.ai/artifact/KFH8ze9uEUDBziMhtfy5Ew (desktop sidebar card, mobile bottom bar).

## Decisions

- **Announce the newest essay only.** No editor's pick, no Soon teaser, nothing external.
- **Automatic, from data Notion already has.** The newest essay with status `Published` and a `Published` date, for **14 days** after that date. No new Notion property.
- **Readers can make it go away.** Dismissing it (×) or opening the essay hides it for that essay, remembered in `localStorage`.
- **Text only.** Label, title, summary (desktop) and a close button. No cover demo or thumbnail, so no demo JavaScript ships with every page.
- **Desktop: sidebar card. Mobile: bottom bar, and only the bar.** Below md the sidebar card is not shown, not even when the mobile sidebar is open, so the announcement never appears twice. Rejected: a banner above the content on any size, because it can only appear after the client checks storage, which shifts the essay down after load; a dot on the mobile sidebar toggle, judged too quiet.
- **Monochrome.** Site tokens only; the "new" marker is a 6px dot in the foreground ink. No accent hue (§10.2).

## Which essay

`getAnnouncement(library)` in `src/lib/content/announcement.ts` (no `now`: with `cacheComponents` on, reading the clock while the layout prerenders fails the build, so the 14-day window is checked only in the browser, by `isAnnouncementLive(announcement, now)`):

- Candidates: every essay in `library.sections` whose `status` is `Published` and whose `published` date is set. The library has already resolved `Preview` through `showPreviews()`, so a Preview essay is a candidate everywhere except Vercel production, matching where its page exists.
- Pick the latest `published` date. Ties: the essay whose section comes first by section `Order`, then essay `Order`. Deterministic, no randomness.
- Return `null` when there is no candidate.
- Returns `{ slug, title, summary, expiresAt }`, with `expiresAt` as an ISO string (`published` at 00:00 UTC + `ANNOUNCE_DAYS` days; `ANNOUNCE_DAYS = 14`, exported).
- `published` is a Notion date without a time; it is read as 00:00 UTC on that day.
- `isAnnouncementLive(announcement, now: number)` is `now < Date.parse(expiresAt)`.

Called once in `src/app/(site)/layout.tsx` beside `getLibrary()`, and passed down as a prop. After the window the server keeps sending the (expired) announcement until a newer essay is published; the client never shows it. That costs a few hundred bytes in the payload.

## When it shows

The announcement is visible only when all of these hold:

1. `getAnnouncement` returned an essay.
2. `Date.now() < expiresAt` on the client.
3. `localStorage["sanding-space:announcement"]` does not hold this essay's slug as dismissed or read.
4. The current path is not that essay's own page.

Storage holds one JSON value `{ slug, state: "dismissed" | "read" }`. It only describes the essay it names: a newer essay replaces the value. Reads and writes are wrapped in try/catch. If storage is unavailable, treat it as empty (the announcement shows, and dismissing still hides it for the rest of the visit through component state).

**Marked read** when the reader opens the essay by any route (the card, the sidebar, a link, a direct visit): a small effect writes `read` whenever the path is the announced essay's page. Both treatments are mounted at every width (CSS hides one), so they share one hook and the write is idempotent. A dismiss in one shows up in the other through a `storage`-independent shared state (a tiny module-level store with `useSyncExternalStore`), not only through `localStorage`.

**No flash, no shift.** The server renders the announcement hidden (`data-ready="false"`, `opacity: 0`, not focusable, `aria-hidden`). After mount, the client runs checks 2–4 and either removes it or sets `data-ready="true"`, which fades it in. Neither treatment takes space in the content flow, so appearing or disappearing never moves the essay.

## Desktop: sidebar card (md and up)

- Lives in the sidebar footer, above Resources and About, inside the pinned area. Its height comes out of the scrolling list above it, never out of the content.
- Layout: 1px `border` on `card`, radius 10px, padding 10px 12px 12px. Top row: 6px foreground dot + "New essay" (12/18, `subtle-foreground`). Then the title (`foreground`, 500) and the summary clamped to two lines (13/19, `muted-foreground`).
- The whole card except the close button is one `Link` to `/<slug>` with `data-sound="page"`. Hover: border goes to `input`, 150ms `--ease-out`.
- Close: 28px icon button in the top-right corner, lucide `X` 16px, `aria-label="Dismiss new essay"`, `data-sound="tap"`, from `src/components/ui/`. It sits outside the link, never nested.
- Hidden below md (`max-md:hidden`): on mobile the bottom bar takes over, and the card would repeat it inside the sidebar.
- The `Sidebar` component gets an optional `announcement` slot rendered above the footer row, so the card stays its own client component and `Sidebar` stays as it is.

## Mobile: bottom bar (below md)

- Fixed to the viewport: `left`/`right` 12px plus `env(safe-area-inset-left/right)`, `bottom` 16px plus `env(safe-area-inset-bottom)`. Height 56px, radius 12px, 1px border one step lighter than `border`, background one step above `card` so it reads as floating over the essay. No shadow.
- Content: dot, then a two-line stack ("New essay" 12/18 `subtle-foreground`, title `foreground` 500 truncated with an ellipsis), then "Read" with lucide `ArrowRight` 14px, then a 36px close button (44px hit area on coarse pointers). Same link, label and sound rules as the card.
- Mounted outside the shell's translated track. `MobileShell` translates the track to push the sidebar in, and a `position: fixed` element inside a transformed ancestor would scroll with it. `MobileShell` gets an `overlay` slot rendered after the track.
- While the sidebar is open the bar fades out and is inert; it comes back when the sidebar closes.
- `md:hidden`.
- Content bottom padding: `main` already has `pb-24` (96px) on mobile, which clears the 72px bar. Add `env(safe-area-inset-bottom)` to it so the last paragraph can still scroll above the bar on phones with a home indicator.

## Motion and sound

- Appear: opacity 0 → 1 and `translateY(8px)` → 0, 300ms `--ease-out`, after the client check. Dismiss: the reverse, 200ms, then unmount. CSS transitions only (no `motion/react` in site chrome).
- Reduced motion: no translate, opacity only, 0ms.
- Sounds: `page` when the link is pressed, `tap` on close. No sound when the announcement appears.

## Accessibility

- The card and bar are each wrapped in an element with `role="region"` and `aria-label="New essay"`, so they can be found but aren't announced as they appear. No live region: appearing on load must not interrupt a screen reader.
- The link's accessible name is "New essay: <title>". The summary is visible text, not part of the name.
- After dismissing, focus moves to the next focusable element in the footer (Resources) on desktop, and to `#main-content` on mobile, so focus is never lost.
- Hidden states are `inert`/`aria-hidden`, not just transparent.
- Contrast: every text color is an existing token already checked against `card` and `background`.

## Files

| File | Change |
|---|---|
| `src/lib/content/announcement.ts` | New: `ANNOUNCE_DAYS`, `getAnnouncement(library)`, `isAnnouncementLive(a, now)`, `Announcement` type |
| `src/lib/content/announcement.test.ts` | New |
| `src/components/announcement/use-announcement.ts` | New: client hook doing checks 2–4, storage read/write, marking read on the essay page |
| `src/components/announcement/sidebar-card.tsx` | New: desktop card |
| `src/components/announcement/bottom-bar.tsx` | New: mobile bar |
| `src/components/announcement/*.test.tsx` | New |
| `src/components/sidebar/sidebar.tsx` | Optional `announcement` slot above the footer row |
| `src/components/sidebar/current-sidebar.tsx` | Passes the slot through |
| `src/components/sidebar/mobile-shell.tsx` | Optional `overlay` slot outside the track, hidden and inert while open |
| `src/app/(site)/layout.tsx` | Calls `getAnnouncement`, passes it to both slots; safe-area bottom padding on `main` |
| `docs/spec.md` §9.1, §9.5 | Describe the card and the bar |
| `AGENTS.md` | One line under Interface layout |

## Testing

Unit (`announcement.test.ts`):
- Picks the latest `Published` essay; ignores `Soon`, `Draft` and essays without a date.
- `Preview` counts only when the library resolved it to `Published`.
- `expiresAt` is the Published date + 14 days at 00:00 UTC; `isAnnouncementLive` is true on day 13, false from day 14.
- Ties broken by section order, then essay order.
- Empty library → `null`.

Component:
- Hidden before the client check; visible after when everything passes.
- Hidden when `expiresAt` has passed on the client although the server sent it.
- Hidden after dismiss, and still hidden on remount (storage).
- Visiting the essay's path writes `read` and hides it.
- A stored value for a different slug does not hide a newer essay.
- Storage that throws: still renders, and dismissing still hides it.
- Bottom bar is inert while the shell is open.
- Close button is not inside the link.

Manual: real phone with a home indicator (safe areas), VoiceOver on the card and the bar, reduced motion, and a Lighthouse run on an essay page to confirm accessibility stays at 100 and there is no layout shift.

## Out of scope

- Announcing several essays, or a "what's new" list.
- RSS, email or push notifications.
- Choosing the essay by hand in Notion.
- Analytics on dismissals or clicks.

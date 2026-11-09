# Announcements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One slot (a sidebar card on desktop, a floating bottom bar on mobile) announces the newest Published essay for 14 days. An active external promo from a new Notion Promotions database takes the slot instead.

**Architecture:** The server builds an ordered list of `AnnouncementItem`s (promos, then the essay) with pure helpers. It can't filter by time, because `cacheComponents` forbids reading the clock during prerender. One client hook owns everything that depends on the browser: the time window, a shared store backed by `localStorage` keyed per item id, marking essays read from the URL, and the phases. A shared link component and two presentational components render the item. They plug into a new `announcement` slot on `Sidebar` and a new `overlay` slot on `MobileShell`, which is rendered outside the translated track so `position: fixed` stays fixed to the viewport.

**Tech Stack:** Next.js App Router (RSC, `cacheComponents`), TypeScript, Tailwind v4, `@notionhq/client`, `notionic/fetch` (`fetchLinkFavicon`), `@base-ui/react` via `src/components/ui/button.tsx`, lucide-react, Vitest + Testing Library (jsdom), Biome, pnpm.

**Spec:** `docs/superpowers/specs/2026-11-09-new-essay-announcement-design.md`

## Global Constraints

- Branch: the current worktree branch (`claude/sanding-space-essay-promotion-744233`), off `develop`; PR into `develop`.
- `ANNOUNCE_DAYS = 14`. Essay window `[published 00:00 UTC, +14 days)`. Promo window `[Start 00:00 UTC, End+1 day 00:00 UTC)`; a missing bound is open.
- No `new Date()` / `Date.now()` in server components or anything they call during render.
- Env `NOTION_PROMOTIONS_DATA_SOURCE_ID` is optional; unset → `getPromotions()` returns `[]`.
- Notion property names, verbatim: `Name`, `Description`, `URL`, `Label`, `Active`, `Start`, `End`.
- Copy, verbatim: essay label `New essay`; default promo label `From the author`; actions `Read` (essay) and `Visit` (external); external link suffix ` (opens in a new tab)`; close button `Dismiss <title>`.
- Storage key `sanding-space:announcement`, value `{ [id]: "dismissed" | "read" }`, max 50 entries; every access in try/catch.
- Desktop card `max-md:hidden`; bottom bar `md:hidden`. The card never shows on mobile.
- Monochrome site tokens; 6px `bg-foreground` dot for essays; 14px favicon (`alt=""`) for external items, dot when none.
- CSS transitions only (no `motion/react`): appear 300ms, leave 200ms, `ease-(--ease-out)`; `motion-reduce`: no translate, no duration.
- `data-sound="page"` on the link, `data-sound="tap"` on close. Close is `Button` from `src/components/ui/button.tsx` with lucide `X`, never inside the link.
- `pnpm lint`, `pnpm typecheck` and `pnpm test` pass at every commit.

## Review Focus

1. **A close never hides a different item:** closing a promo leaves the next new essay visible, and the other way round. Pinned in Task 3 (`a dismissed promo does not hide the essay on the next path`).
2. **Storage that throws** (private mode, blocked data): it still renders, and close still works for the visit. Pinned in Task 3 (`works when localStorage throws`).
3. **Landing directly on the announced essay:** it doesn't show there, and stays gone later. Pinned in Task 3 (`marks the essay read on its own path, trailing slash included`).
4. **Opening the mobile sidebar over the bar:** the bar is inert and faded. Pinned in Task 5 (`overlay is inert while the sidebar is open`).
5. **A promo scheduled ahead or already ended** while a cached page is served: it's skipped, and the essay shows. Pinned in Task 3 (`skips items outside their window`).

---

### Task 1: Announcement items (pure)

**Files:**
- Create: `src/lib/content/announcement.ts`
- Test: `src/lib/content/announcement.test.ts`
- Modify: `src/lib/content/types.ts` (add `Promotion`)

**Interfaces:**
- Consumes: `Library` (types.ts).
- Produces:
  - `export type Promotion = { id: string; name: string; description: string; url: string; label: string | null; active: boolean; start: string | null; end: string | null; favicon: string | null }` (in `types.ts`)
  - `export const ANNOUNCE_DAYS = 14`
  - `export type AnnouncementItem` exactly as in the spec's Data flow block
  - `export function essayAnnouncement(library: Library): AnnouncementItem | null`
  - `export function promotionAnnouncement(p: Promotion): AnnouncementItem`
  - `export function announcementItems(library: Library, promotions: Promotion[]): AnnouncementItem[]`
  - `export function isLive(item: AnnouncementItem, now: number): boolean`

- [ ] **Step 1: Write the failing tests** (factories `section()`, `essay()` as in `library.test.ts`; `promo(o)` with defaults `{ id: "p1", name: "Interfaces", description: "A magazine.", url: "https://interfaces.example", label: null, active: true, start: null, end: null, favicon: null }`)

- essay item: `picks the latest Published essay with a date`, `ignores Soon essays and essays without a date`, `breaks ties by section order, then essay order`, `returns null for an empty library`. `builds the essay item` asserts that `published: "2026-11-01"`, title `T`, summary `S` gives `{ kind: "essay", id: "e1", title: "T", summary: "S", href: "/e1", label: "New essay", icon: null, startsAt: null, expiresAt: "2026-11-15T00:00:00.000Z" }`.
- promo item: `builds the promotion item` asserts that `start "2026-11-10"`, `end "2026-11-20"`, favicon `"data:x"` gives `{ kind: "external", id: "p1", title: "Interfaces", summary: "A magazine.", href: "https://interfaces.example", label: "From the author", icon: "data:x", startsAt: "2026-11-10T00:00:00.000Z", expiresAt: "2026-11-21T00:00:00.000Z" }`. `keeps a custom label` covers `label: "My magazine"`. `leaves missing dates open` asserts `startsAt` and `expiresAt` are `null`.
- `announcementItems`: `lists promotions first, then the essay`, with two promos and one essay; ids come out in order `["p1", "p2", "e1"]`.
- `isLive`: an essay expiring `2026-11-15` is live at `2026-11-14T23:59:59Z` and not at `2026-11-15T00:00:00Z`. A promo starting `2026-11-10` is not live at `2026-11-09T23:59:59Z` and is at `2026-11-10T00:00:00Z`. A fully open promo is live at any time.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/lib/content/announcement.test.ts`
Expected: FAIL (missing exports).

- [ ] **Step 3: Implement.** Dates: `day = value.slice(0, 10)`, `Date.parse(`${day}T00:00:00.000Z`)`, add whole days, `toISOString()`. Essay pick: strictly greater date wins, walking sections and essays in order.

- [ ] **Step 4: Run to verify it passes.** Same command. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/announcement.ts src/lib/content/announcement.test.ts src/lib/content/types.ts
git commit -m "feat: build announcement items from essays and promotions"
```

---

### Task 2: Promotions from Notion

**Files:**
- Modify: `src/lib/content/parse.ts` (`parsePromotion`), `src/lib/content/parse.test.ts`
- Create: `src/lib/content/__fixtures__/promotion-page.json`
- Create: `src/lib/content/promotions.ts`, `src/lib/content/promotions.test.ts`
- Modify: `src/lib/content/notion.ts` (`getPromotions`)

**Interfaces:**
- Consumes: `Promotion` (Task 1).
- Produces:
  - `export function parsePromotion(page: PageObjectResponse): Promotion` (`favicon: null`)
  - `export function selectPromotions(rows: Promotion[]): Promotion[]`
  - `export async function getPromotions(): Promise<Promotion[]>`

- [ ] **Step 1: Write the failing tests**

- Fixture: copy `resource-page.json` and set its properties to `Name` (title "Interfaces"), `Description` (rich_text "A magazine."), `URL` (url "https://interfaces.example"), `Label` (rich_text ""), `Active` (checkbox true), `Start` (date `{ start: "2026-11-10" }`), and `End` (date null).
- `parsePromotion`, test `reads every property` asserts `{ id: normalizePageId(fixture.id), name: "Interfaces", description: "A magazine.", url: "https://interfaces.example", label: null, active: true, start: "2026-11-10", end: null, favicon: null }`. An empty Label counts as null.
- `parsePromotion`, test `treats missing columns as empty`: delete `Active`, `Start`, `End` and `Label` from a clone, and expect `active: false`, `start: null`, `end: null`, `label: null`.
- `selectPromotions`:
  - `drops inactive rows and rows without a name or URL`;
  - `sorts by Start, latest first, empty Start last`: given starts `["2026-11-01", null, "2026-11-05"]`, the ids come out ordered `"2026-11-05"`, `"2026-11-01"`, `null`;
  - `breaks ties by name`.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/lib/content/parse.test.ts src/lib/content/promotions.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** `parsePromotion` (use the file's `propOfType` helpers; date via the `date` property's `.date?.start`), `selectPromotions`, and `getPromotions`. `getPromotions` starts with `"use cache"; cacheTag("notion"); cacheLife("minutes")`. It reads `process.env.NOTION_PROMOTIONS_DATA_SOURCE_ID` directly (not `env()`, which throws) and returns `[]` when that's unset. Otherwise it calls `queryAll`, then `parsePromotion`, then `selectPromotions`, then adds the favicon with `fetchLinkFavicon(hostOf(url), LINK_FAVICONS).catch(() => null)`, following `withFavicons`.

- [ ] **Step 4: Run to verify it passes.** Same command, plus `pnpm typecheck`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/parse.ts src/lib/content/parse.test.ts src/lib/content/__fixtures__/promotion-page.json src/lib/content/promotions.ts src/lib/content/promotions.test.ts src/lib/content/notion.ts
git commit -m "feat: read external promotions from Notion"
```

---

### Task 3: Client hook and store

**Files:**
- Create: `src/components/announcement/use-announcement.ts`
- Test: `src/components/announcement/use-announcement.test.tsx`

**Interfaces:**
- Consumes: `AnnouncementItem`, `isLive` (Task 1); `usePathname`.
- Produces:
  - `export type AnnouncementPhase = "pending" | "shown" | "leaving" | "hidden"`
  - `export function useAnnouncement(items: AnnouncementItem[]): { phase: AnnouncementPhase; item: AnnouncementItem | null; dismiss: () => void }`
  - `export const STORAGE_KEY = "sanding-space:announcement"`
  - `export function resetAnnouncementStore(): void` (tests)

Behavior (as in the spec, "When it shows"):
- The module store is a `Record<string, "dismissed" | "read">`. It's loaded lazily from storage and shared through `useSyncExternalStore` (server snapshot `{}`). Writes update memory first, then storage, dropping the oldest keys past 50.
- `item` is chosen after mount and again on each pathname change. It's the first item that is live at `Date.now()`, has no store entry, and isn't an essay whose `/${id}` equals the path (trailing slash ignored). It is *not* re-chosen when the store changes: after a close, `item` keeps its value through `leaving` and the phase ends at `hidden` until the path changes.
- When the path is an essay item's page, `read` is written for that id.
- `dismiss()` writes `dismissed`, then `leaving`, then `hidden` after 200ms (0 under `prefers-reduced-motion: reduce`).

- [ ] **Step 1: Write the failing tests** (`vi.mock("next/navigation")` with a mutable `pathname`; fake timers at `2026-11-09T12:00:00Z`; reset storage and store in `beforeEach`; fixtures `essay` = `{ kind: "essay", id: "layout", href: "/layout", label: "New essay", expiresAt: "2026-11-15T00:00:00.000Z", … }`, `promo` = `{ kind: "external", id: "p1", startsAt: null, expiresAt: null, … }`)

- `starts pending`
- `shows the essay on another page` (path `/spring` → `shown`, `item.id === "layout"`)
- `prefers a live promotion over the essay` (items `[promo, essay]` → `p1`)
- `skips items outside their window`: the promo has `startsAt: "2026-11-10T00:00:00.000Z"` and gives `layout`, and an essay expired on `2026-11-01` gives `hidden`.
- `dismiss persists per id`: storage equals `{ p1: "dismissed" }` after the close, and the phase goes `leaving`, then `hidden` 200ms later.
- `a dismissed promo does not hide the essay on the next path`: after the close, the phase stays `hidden` on the same path. Rerender with path `/other`, and `item.id` is `layout`.
- `marks the essay read on its own path, trailing slash included`: path `/layout/` gives `hidden` and storage `{ layout: "read" }`.
- `two hooks share a dismissal`
- `works when localStorage throws`: `getItem` and `setItem` throw, the hook still shows, and a close still hides.
- `leaves instantly with reduced motion`
- `caps storage at 50 entries`: pre-fill 50 keys and close one more. The stored object has 50 keys and the first pre-filled key is gone.

- [ ] **Step 2: Run to verify it fails.** `pnpm vitest run src/components/announcement/use-announcement.test.tsx` → FAIL.
- [ ] **Step 3: Implement** (`"use client"`).
- [ ] **Step 4: Run to verify it passes.** Same command. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src/components/announcement/use-announcement.ts src/components/announcement/use-announcement.test.tsx
git commit -m "feat: choose and remember the announcement in the browser"
```

---

### Task 4: Shared link and desktop sidebar card

**Files:**
- Create: `src/components/announcement/announcement-link.tsx`
- Create: `src/components/announcement/sidebar-card.tsx`, `sidebar-card.test.tsx`
- Modify: `src/components/sidebar/sidebar.tsx`, `current-sidebar.tsx`, `sidebar.test.tsx`

**Interfaces:**
- Consumes: `useAnnouncement`, `AnnouncementItem`.
- Produces:
  - `export function AnnouncementLink({ item, className, children }: { item: AnnouncementItem; className?: string; children: ReactNode })`. For essays it renders a `Link` to `item.href`; for external items, `<a href target="_blank" rel="noopener">`. Either way it has `data-sound="page"` and `aria-label` set to `${label}: ${title}`, plus ` (opens in a new tab)` for external items.
  - `export function AnnouncementMarker({ item }: { item: AnnouncementItem })`: the favicon `<img alt="" class="size-3.5 rounded-[3px]">` when `kind === "external" && icon`, otherwise the dot `<span class="size-1.5 rounded-full bg-foreground">`.
  - `export function SidebarCard({ items }: { items: AnnouncementItem[] })`
  - `Sidebar`, `CurrentSidebar`: `announcement?: ReactNode`, rendered right before the footer row.

Card: `null` when `hidden`. Wrapper `role="region"` with `aria-label={item.label}`, `data-phase`, `relative mt-3 max-md:hidden rounded-[10px] border border-border bg-card has-[a:hover]:border-input`, and the phase classes (`pending` and `leaving` get `opacity-0 translate-y-2 motion-reduce:translate-y-0`, plus `inert` and `aria-hidden`). Inside: `AnnouncementLink` (`block px-3 pt-2.5 pb-3`) holding the marker, the label (`text-xs/[18px] text-subtle-foreground`), the title (`font-medium text-foreground`) and the summary (`line-clamp-2 text-[13px]/[19px] text-muted-foreground`). Next to it, `<Button size="icon-sm" aria-label={`Dismiss ${title}`} data-sound="tap" className="absolute top-1 right-1"><X /></Button>`. On click it calls `dismiss()` and focuses `a[href="/resources"]`.

- [ ] **Step 1: Write the failing tests** (same mocks as Task 3)

- `renders the essay item`: the region is named `New essay`, and the link `New essay: Layout` has `href="/layout"` and no `target`.
- `renders an external item in a new tab`: the link `From the author: Interfaces (opens in a new tab)` has `target="_blank"` and `rel="noopener"`, and the `img` has `alt=""`.
- `close button is not inside the link`
- `dismiss removes it and focuses Resources`
- `hidden on mobile` (`max-md:hidden`)
- `sidebar.test.tsx`: `renders the announcement slot above Resources` (`compareDocumentPosition` has `DOCUMENT_POSITION_FOLLOWING`).

- [ ] **Step 2: Run to verify it fails.** `pnpm vitest run src/components/announcement/sidebar-card.test.tsx src/components/sidebar/sidebar.test.tsx` → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run to verify it passes.** `pnpm vitest run src/components/announcement src/components/sidebar` → PASS.
- [ ] **Step 5: Commit**

```bash
git add src/components/announcement src/components/sidebar/sidebar.tsx src/components/sidebar/current-sidebar.tsx src/components/sidebar/sidebar.test.tsx
git commit -m "feat: show the announcement card in the sidebar footer"
```

---

### Task 5: Mobile bottom bar

**Files:**
- Create: `src/components/announcement/bottom-bar.tsx`, `bottom-bar.test.tsx`
- Modify: `src/components/sidebar/mobile-shell.tsx`, `mobile-shell.test.tsx`, `src/app/globals.css` (if new tokens)

**Interfaces:**
- Consumes: `useAnnouncement`, `AnnouncementLink`, `AnnouncementMarker`.
- Produces: `export function BottomBar({ items }: { items: AnnouncementItem[] })`; `MobileShell` gets `overlay?: ReactNode`.

Shell: after the `shell-track` div (outside `ViewTransition`), add `<div data-open={open} inert={open} className="md:hidden transition-opacity duration-200 ease-(--ease-out) data-[open=true]:opacity-0 motion-reduce:transition-none">{overlay}</div>`.

Bar:
- Same phase and region rules as the card.
- Wrapper: `fixed z-20 md:hidden h-14 rounded-xl border`, with insets `left: calc(12px + env(safe-area-inset-left))`, `right: calc(12px + env(safe-area-inset-right))`, `bottom: calc(16px + env(safe-area-inset-bottom))`.
- Background and border: add `--raised: oklch(0.235 0 0)` and `--raised-border: oklch(0.35 0 0)` to the dark tokens in `globals.css` and register them in `@theme inline`.
- Link (`flex h-full items-center gap-2.5 ps-3.5`): marker; the label and the title stack (`truncate`); then the action, `Read` with `ArrowRight` or `Visit` with `ArrowUpRight` (`size-3.5`, `text-[13px] text-foreground`).
- Close: `Button size="icon" className="pointer-coarse:size-11"`. It focuses `#main-content` after a close.

- [ ] **Step 1: Write the failing tests**
  - `renders the essay item with Read`
  - `renders an external item with Visit in a new tab`
  - `close button is not inside the link`
  - `dismiss removes it and focuses main`
  - `hidden on desktop` (`md:hidden`)
  - `mobile-shell.test.tsx`: `overlay is inert while the sidebar is open` (wrapper `inert` and `data-open="true"` after the toggle; `inert` is gone after closing). `overlay renders outside the track` checks that `.shell-track` doesn't contain it.
- [ ] **Step 2: Run to verify it fails.** `pnpm vitest run src/components/announcement/bottom-bar.test.tsx src/components/sidebar/mobile-shell.test.tsx` → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run to verify it passes.** `pnpm vitest run src/components/announcement src/components/sidebar` → PASS.
- [ ] **Step 5: Commit**

```bash
git add src/components/announcement src/components/sidebar/mobile-shell.tsx src/components/sidebar/mobile-shell.test.tsx src/app/globals.css
git commit -m "feat: show the announcement as a bottom bar on mobile"
```

---

### Task 6: Wire the layout and document it

**Files:**
- Modify: `src/app/(site)/layout.tsx`, `docs/spec.md`, `AGENTS.md`, `.env.example` (if present)

- [ ] **Step 1: Layout**
  - `const [library, promotions] = await Promise.all([getLibrary(), getPromotions()]); const items = announcementItems(library, promotions);`
  - Pass `announcement={<SidebarCard items={items} />}` to both the fallback `Sidebar` and `CurrentSidebar`, and `overlay={<BottomBar items={items} />}` to `MobileShell`.
  - `main`: change `pb-24` to `pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-24`.
- [ ] **Step 2: Docs**
  - `docs/spec.md`: add §3.5 Promotions (the spec's property table and candidate rule); add `NOTION_PROMOTIONS_DATA_SOURCE_ID` (optional) to the env list.
  - §9.1: a bullet for the announcement card above Resources.
  - §9.5: a bullet for the bottom bar, noting that the card doesn't show on mobile.
  - `AGENTS.md`: add the env line `NOTION_PROMOTIONS_DATA_SOURCE_ID=` (optional), and append to the Sidebar bullet: "an announcement card above Resources (newest essay, or an external promo from the Promotions database; a bottom bar on mobile)".
- [ ] **Step 3: Full checks.** `pnpm lint && pnpm typecheck && pnpm test` → all pass. `pnpm build` → builds with no prerender error about the current time, with the env variable unset.
- [ ] **Step 4: Manual check** in `pnpm dev` at desktop and 375px:
  - **Essay item:** make it live by setting a recent Published date, or by raising `ANNOUNCE_DAYS` locally and reverting after.
  - **Close and read:** close it and reload; open the essay.
  - **Mobile sidebar:** open it while the bar shows.
  - **Reduced motion:** check with it turned on.
  - **External promo:** if the user has created the database and set the env variable, add one Active row and check it wins over the essay; otherwise note it as untested.
  - **Lighthouse** on an essay page: Accessibility 100, CLS 0.
- [ ] **Step 5: Commit**

```bash
git add "src/app/(site)/layout.tsx" docs/spec.md AGENTS.md
git commit -m "feat: announce new essays and external promos"
```

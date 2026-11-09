# New Essay Announcement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Announce the newest Published essay for 14 days: a card in the sidebar footer on desktop and a floating bar at the bottom of the screen on mobile. Readers can dismiss it, and it also goes away once they've read the essay.

**Architecture:** A pure server helper picks the essay from the library (no clock: `cacheComponents` forbids `new Date()` during prerender). One client hook owns everything that depends on the browser: the 14-day check, a small shared store backed by `localStorage`, marking read from the URL, and the appear/leave states. Two presentational components use that hook. The sidebar card goes into a new `announcement` slot on `Sidebar`. The bottom bar goes into a new `overlay` slot on `MobileShell`, rendered outside the translated track so `position: fixed` stays fixed to the viewport.

**Tech Stack:** Next.js App Router (RSC, `cacheComponents`), TypeScript, Tailwind v4, `@base-ui/react` via `src/components/ui/button.tsx`, lucide-react, Vitest + Testing Library (jsdom), Biome, pnpm.

**Spec:** `docs/superpowers/specs/2026-11-09-new-essay-announcement-design.md`

## Global Constraints

- Branch: the current worktree branch (`claude/sanding-space-essay-promotion-744233`), off `develop`; PR into `develop`.
- `ANNOUNCE_DAYS = 14`. Window: `expiresAt = published (00:00 UTC) + 14 days`; live while `now < expiresAt`.
- No `new Date()` / `Date.now()` in any server component or server module called during render.
- Storage key, verbatim: `sanding-space:announcement`; value `{"slug": string, "state": "dismissed" | "read"}`. Every read and write in try/catch.
- Copy, verbatim: label `New essay`; close button `aria-label="Dismiss new essay"`; region `aria-label="New essay"`; link accessible name `New essay: <title>`; bar action `Read`.
- Desktop card only at `md` and up (`max-md:hidden`); bottom bar only below `md` (`md:hidden`). The card never shows on mobile, not even in the open sidebar.
- Monochrome: site tokens only, 6px dot in `bg-foreground`. No accent hue, no shadows.
- Motion: CSS transitions only (no `motion/react`), opacity + transform. Appear 300ms, leave 200ms, `ease-(--ease-out)`. `motion-reduce`: no translate, no duration.
- Sound: `data-sound="page"` on the link, `data-sound="tap"` on close. Nothing on appear.
- Close button from `src/components/ui/button.tsx` (`Button`), lucide `X`. Never nested in the link.
- `pnpm lint`, `pnpm typecheck` and `pnpm test` pass at every commit.

## Review Focus

1. **Stored value for an older essay:** a reader who dismissed last month's essay must still see the new one. Pinned in Task 2 (`shows a newer essay despite an older stored slug`).
2. **Storage that throws** (Safari private mode, blocked site data): it must still render, and dismissing must still hide it for the visit. Pinned in Task 2 (`works when localStorage throws`).
3. **Landing directly on the announced essay** (from a shared link): it must not show there, and it must not show afterward on other pages. Pinned in Task 2 (`marks read on the essay's own path, trailing slash included`).
4. **Opening the mobile sidebar while the bar is visible:** the bar must not cover the sidebar footer or take taps. Pinned in Task 4 (`overlay is inert while the sidebar is open`).
5. **Cached page served after the window:** the server still sends the announcement on day 20; the client must not show it. Pinned in Task 2 (`hidden once expiresAt has passed`).

---

### Task 1: Pick the announced essay

**Files:**
- Create: `src/lib/content/announcement.ts`
- Test: `src/lib/content/announcement.test.ts`

**Interfaces:**
- Consumes: `Library`, `Essay` from `src/lib/content/types.ts`.
- Produces:
  - `export const ANNOUNCE_DAYS = 14`
  - `export type Announcement = { slug: string; title: string; summary: string; expiresAt: string }`
  - `export function getAnnouncement(library: Library): Announcement | null`
  - `export function isAnnouncementLive(a: Announcement, now: number): boolean`

- [ ] **Step 1: Write the failing tests**

Reuse the `section()` / `essay()` factories from `library.test.ts` (copy them; build `Library` with `buildLibrary`).

```ts
describe("getAnnouncement", () => {
  it("picks the latest Published essay with a date", () => {
    const lib = buildLibrary([section()], [
      essay({ id: "a", slug: "a", published: "2026-10-01" }),
      essay({ id: "b", slug: "b", published: "2026-11-01", order: 2 }),
    ]);
    expect(getAnnouncement(lib)?.slug).toBe("b");
  });
  it("ignores Soon essays and essays without a date", () => {
    const lib = buildLibrary([section()], [
      essay({ id: "a", slug: "a", published: "2026-10-01" }),
      essay({ id: "s", slug: "s", status: "Soon", published: "2026-11-05" }),
      essay({ id: "n", slug: "n", published: null }),
    ]);
    expect(getAnnouncement(lib)?.slug).toBe("a");
  });
  it("breaks ties by section order, then essay order", () => {
    const lib = buildLibrary(
      [section({ id: "s1", order: 2 }), section({ id: "s2", slug: "motion", order: 1 })],
      [
        essay({ id: "x", slug: "x", sectionId: "s1", published: "2026-11-01" }),
        essay({ id: "y", slug: "y", sectionId: "s2", order: 2, published: "2026-11-01" }),
        essay({ id: "z", slug: "z", sectionId: "s2", order: 1, published: "2026-11-01" }),
      ],
    );
    expect(getAnnouncement(lib)?.slug).toBe("z");
  });
  it("returns null for an empty library", () => {
    expect(getAnnouncement(buildLibrary([], []))).toBeNull();
  });
  it("sets expiresAt to 00:00 UTC, 14 days after the Published date", () => {
    const lib = buildLibrary([section()], [essay({ published: "2026-11-01", title: "T", summary: "S" })]);
    expect(getAnnouncement(lib)).toEqual({ slug: "e1", title: "T", summary: "S", expiresAt: "2026-11-15T00:00:00.000Z" });
  });
});

describe("isAnnouncementLive", () => {
  const a = { slug: "e", title: "", summary: "", expiresAt: "2026-11-15T00:00:00.000Z" };
  it("is live on day 13", () => expect(isAnnouncementLive(a, Date.parse("2026-11-14T23:59:59Z"))).toBe(true));
  it("is over from day 14", () => expect(isAnnouncementLive(a, Date.parse("2026-11-15T00:00:00Z"))).toBe(false));
});
```

`Preview` needs no test of its own here: `getLibrary` resolves it to `Published` or `Soon` before this runs (`resolvePreview` is already tested). Add one line to the first test's comment saying so.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/lib/content/announcement.test.ts`
Expected: FAIL, cannot resolve `./announcement`.

- [ ] **Step 3: Implement the four exports**

Walk `library.sections` in order, then `section.essays` in order. Keep the first essay with the strictly greatest `published`, so ties resolve to section order, then essay order. `published` may be a date (`2026-11-01`) or a datetime: take `published.slice(0, 10)`, parse it as `${day}T00:00:00.000Z`, add `ANNOUNCE_DAYS * 86_400_000` and call `toISOString()`.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run src/lib/content/announcement.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/announcement.ts src/lib/content/announcement.test.ts
git commit -m "feat: pick the newest essay to announce"
```

---

### Task 2: Client state hook

**Files:**
- Create: `src/components/announcement/use-announcement.ts`
- Test: `src/components/announcement/use-announcement.test.tsx`

**Interfaces:**
- Consumes: `Announcement`, `isAnnouncementLive` (Task 1); `usePathname` from `next/navigation`.
- Produces:
  - `export type AnnouncementPhase = "pending" | "shown" | "leaving" | "hidden"`
  - `export function useAnnouncement(a: Announcement | null): { phase: AnnouncementPhase; dismiss: () => void }`
  - `export const STORAGE_KEY = "sanding-space:announcement"`
  - `export function resetAnnouncementStore(): void` (tests only: clears the in-memory value)

Behavior:
- A module-level store holds `{ slug, state } | null`. It's initialized lazily from `localStorage`, and changes reach every subscriber through `useSyncExternalStore`, so the card and the bar always agree. `getServerSnapshot` returns `null`. Writes update memory first, then try `localStorage`.
- `phase` is `"pending"` on the server and on the first client render (use a mounted flag set in an effect), so hydration matches. After mount it's `"hidden"` if any of these hold: `a` is null, `!isAnnouncementLive(a, Date.now())`, the store holds `a.slug` (either state), or the path is `/${a.slug}` (trailing slash ignored). Otherwise it's `"shown"`.
- When the path is `/${a.slug}`, an effect writes `{ slug: a.slug, state: "read" }`. Writing the same value again is harmless.
- `dismiss()` writes `{ slug, state: "dismissed" }`, sets `"leaving"`, then `"hidden"` after 200ms (0ms when `matchMedia("(prefers-reduced-motion: reduce)").matches`).

- [ ] **Step 1: Write the failing tests**

Use `renderHook`. Mock `next/navigation` with `vi.mock` so `usePathname` returns a variable you set per test. Use `vi.useFakeTimers()` and `vi.setSystemTime(new Date("2026-11-09T12:00:00Z"))`. Clear `localStorage` and call `resetAnnouncementStore()` in `beforeEach`. Fixture: `a = { slug: "layout", title: "Layout", summary: "S", expiresAt: "2026-11-15T00:00:00.000Z" }`.

Tests and assertions:
- `starts pending`: the first `result.current.phase` captured during render is `"pending"`.
- `shows on another page`: path `/spring`, after effects → `"shown"`.
- `hidden once expiresAt has passed`: system time `2026-11-20`, → `"hidden"`.
- `hidden for null`: `useAnnouncement(null)` → `"hidden"`.
- `dismiss hides and persists`: `act(() => dismiss())` → `"leaving"`; advance 200ms → `"hidden"`; `JSON.parse(localStorage.getItem(STORAGE_KEY)!)` equals `{ slug: "layout", state: "dismissed" }`; after `resetAnnouncementStore()`, a fresh `renderHook` → `"hidden"`.
- `marks read on the essay's own path, trailing slash included`: path `/layout/` → `"hidden"` and storage `{ slug: "layout", state: "read" }`; then path `/spring` in a new render → still `"hidden"`.
- `shows a newer essay despite an older stored slug`: storage pre-set to `{ slug: "old", state: "dismissed" }` → `"shown"`.
- `two hooks share state`: render both in one `renderHook` callback; dismiss through the first; after 200ms the second's phase is `"hidden"`.
- `works when localStorage throws`: `vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error() })`, same for `setItem` → `"shown"`; dismiss → `"hidden"` after 200ms, no throw.
- `leaves instantly with reduced motion`: stub `window.matchMedia` to match → after dismiss and `vi.advanceTimersByTime(0)`, the phase is `"hidden"`.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/components/announcement/use-announcement.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `useAnnouncement` and the store** (`"use client"` at the top of the file)

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run src/components/announcement/use-announcement.test.tsx`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/announcement/use-announcement.ts src/components/announcement/use-announcement.test.tsx
git commit -m "feat: track whether the essay announcement should show"
```

---

### Task 3: Desktop sidebar card

**Files:**
- Create: `src/components/announcement/sidebar-card.tsx`
- Test: `src/components/announcement/sidebar-card.test.tsx`
- Modify: `src/components/sidebar/sidebar.tsx` (new prop, rendered just before the footer `div.flex.shrink-0.items-end`)
- Modify: `src/components/sidebar/current-sidebar.tsx` (pass the prop through)
- Test: `src/components/sidebar/sidebar.test.tsx` (one test for the slot)

**Interfaces:**
- Consumes: `useAnnouncement`, `Announcement`.
- Produces:
  - `export function SidebarCard({ announcement }: { announcement: Announcement | null })`
  - `Sidebar` and `CurrentSidebar` get `announcement?: ReactNode`

Markup (classes may vary; the structure and values come from the spec):
- When `phase === "hidden"`, return `null`.
- Otherwise render a wrapper with `role="region"`, `aria-label="New essay"`, `data-phase={phase}` and classes `relative mt-3 max-md:hidden rounded-[10px] border border-border bg-card` plus the transition. `pending` and `leaving` get `opacity-0 translate-y-2` (`motion-reduce:translate-y-0`), and `shown` gets `opacity-100 translate-y-0`. `pending` and `leaving` also set `inert` and `aria-hidden`.
- Inside it is a `Link` to `/${slug}` with `data-sound="page"` and `aria-label={`New essay: ${title}`}`, padded `px-3 pt-2.5 pb-3`. In order: a row with the 6px dot (`size-1.5 rounded-full bg-foreground`) and `New essay` (`text-xs/[18px] text-subtle-foreground`); the title (`font-medium text-foreground`); the summary (`line-clamp-2 text-[13px]/[19px] text-muted-foreground`). Hover: `hover:border-input` on the wrapper (`has-[a:hover]`).
- Next to the link, not inside it: `<Button size="icon-sm" aria-label="Dismiss new essay" data-sound="tap" className="absolute top-1 right-1">` containing `<X />`. On click: `dismiss()`, then focus `document.querySelector<HTMLElement>('a[href="/resources"]')`.

- [ ] **Step 1: Write the failing tests**

Mock `next/navigation` (`usePathname` → `/spring`) and fake timers at `2026-11-09`, as in Task 2.
- `renders title, summary and label once shown`: `screen.getByRole("region", { name: "New essay" })`; the link named `New essay: Layout` has `href="/layout"`.
- `close button is not inside the link`: `link.contains(screen.getByRole("button", { name: "Dismiss new essay" }))` is false.
- `dismiss removes it and focuses Resources`: render the card next to `<a href="/resources">Resources</a>`; click close; advance 200ms; the region is gone; `document.activeElement` is the Resources link.
- `hidden on mobile`: the region's class list contains `max-md:hidden`.

In `sidebar.test.tsx`: `renders the announcement slot above Resources`. Render `Sidebar` with `announcement={<div data-testid="ann" />}`; `screen.getByTestId("ann").compareDocumentPosition(screen.getByRole("link", { name: "Resources" }))` has `Node.DOCUMENT_POSITION_FOLLOWING` set.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/components/announcement/sidebar-card.test.tsx src/components/sidebar/sidebar.test.tsx`
Expected: FAIL (module missing; slot not rendered).

- [ ] **Step 3: Implement `SidebarCard`, the `Sidebar` slot and the `CurrentSidebar` pass-through**

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run src/components/announcement src/components/sidebar`
Expected: PASS, including the existing sidebar and shell tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/announcement/sidebar-card.tsx src/components/announcement/sidebar-card.test.tsx src/components/sidebar/sidebar.tsx src/components/sidebar/current-sidebar.tsx src/components/sidebar/sidebar.test.tsx
git commit -m "feat: show the new essay card in the sidebar footer"
```

---

### Task 4: Mobile bottom bar

**Files:**
- Create: `src/components/announcement/bottom-bar.tsx`
- Test: `src/components/announcement/bottom-bar.test.tsx`
- Modify: `src/components/sidebar/mobile-shell.tsx` (new `overlay?: ReactNode` prop, rendered after the `shell-track` div)
- Test: `src/components/sidebar/mobile-shell.test.tsx`

**Interfaces:**
- Consumes: `useAnnouncement`, `Announcement`.
- Produces:
  - `export function BottomBar({ announcement }: { announcement: Announcement | null })`
  - `MobileShell` gets `overlay?: ReactNode`

Shell: wrap `overlay` in `<div data-open={open} inert={open} className="md:hidden transition-opacity duration-200 ease-(--ease-out) data-[open=true]:opacity-0 motion-reduce:transition-none">`, placed after the track div and outside `ViewTransition`.

Bar markup: same phase handling, region label, link name, sound and close rules as Task 3.
- Wrapper: `fixed z-20 md:hidden h-14 rounded-xl border bg-…`. Use a border one step lighter than `border` and a background one step above `card`. Add both as tokens in `globals.css` if no existing token fits (`--raised: oklch(0.235 0 0)` and `--raised-border: oklch(0.35 0 0)`, dark values, registered in `@theme inline`).
- Insets: `left: calc(12px + env(safe-area-inset-left))`, `right: calc(12px + env(safe-area-inset-right))`, `bottom: calc(16px + env(safe-area-inset-bottom))`.
- The link holds: the dot; a two-line stack (`New essay` 12/18 `subtle-foreground`, then the title as `truncate font-medium text-foreground`); then `Read` with `ArrowRight` (`size-3.5`) in `text-[13px] text-foreground`.
- Close: `Button size="icon"`, plus `pointer-coarse:size-11`. On dismiss, focus `document.getElementById("main-content")`.

- [ ] **Step 1: Write the failing tests**

- `bottom-bar.test.tsx`: `renders once shown with a Read action` (the link named `New essay: Layout`, containing text `Read`); `close button is not inside the link`; `dismiss removes it and focuses main` (render it next to `<main id="main-content" tabIndex={-1} />`); `hidden on desktop` (the class list contains `md:hidden`).
- `mobile-shell.test.tsx`: `overlay is inert while the sidebar is open`. Render `MobileShell` with `overlay={<button>bar</button>}` using the existing test setup in that file. Click the toggle (`aria-expanded` becomes `"true"`). The overlay wrapper (`screen.getByText("bar").parentElement`) has the `inert` attribute and `data-open="true"`. Close it, and `inert` is gone.
- `mobile-shell.test.tsx`: `overlay renders outside the track`. `container.querySelector(".shell-track")?.contains(screen.getByText("bar"))` is false.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/components/announcement/bottom-bar.test.tsx src/components/sidebar/mobile-shell.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `BottomBar` and the `MobileShell` overlay slot**

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run src/components/announcement src/components/sidebar`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/announcement/bottom-bar.tsx src/components/announcement/bottom-bar.test.tsx src/components/sidebar/mobile-shell.tsx src/components/sidebar/mobile-shell.test.tsx src/app/globals.css
git commit -m "feat: show the new essay bar at the bottom on mobile"
```

---

### Task 5: Wire into the site layout and document it

**Files:**
- Modify: `src/app/(site)/layout.tsx`
- Modify: `docs/spec.md` (§9.1 sidebar footer, §9.5 mobile)
- Modify: `AGENTS.md` (Interface layout)

**Interfaces:**
- Consumes: `getAnnouncement` (Task 1), `SidebarCard` (Task 3), `BottomBar` + `MobileShell.overlay` (Task 4).

- [ ] **Step 1: Wire the layout**

`const announcement = getAnnouncement(library);` goes right after `getLibrary()`. Pass `announcement={<SidebarCard announcement={announcement} />}` to both the Suspense fallback `Sidebar` and `CurrentSidebar`, and `overlay={<BottomBar announcement={announcement} />}` to `MobileShell`. Change `main`'s `pb-24` to `pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-24`.

- [ ] **Step 2: Docs**

- §9.1: add a bullet before the footer bullet: the "New essay" card above Resources (md and up), the newest Published essay for 14 days, dismissible, hidden once read, hidden on its own page.
- §9.5: add a bullet: below md the announcement is a bar floating above the bottom edge instead; the sidebar card is not shown; the bar hides while the sidebar is open.
- `AGENTS.md`, Interface layout, Sidebar bullet: append "a New essay card above Resources (desktop; a bottom bar on mobile), see `docs/superpowers/specs/2026-11-09-new-essay-announcement-design.md`".

- [ ] **Step 3: Full checks**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: all pass.

Run: `pnpm build`
Expected: builds with no prerender error about current time. If no essay in the live data is within 14 days, the build still passes, and the announcement renders as hidden.

- [ ] **Step 4: Manual check in the browser**

In `pnpm dev`, temporarily set one essay's Published date in Notion to today (or change `ANNOUNCE_DAYS` locally, then revert). Check:
- Desktop: the card fades in above Resources and the essay doesn't move. × hides it, and it stays hidden after reload. Opening the essay hides it.
- Mobile at 375px: the bar floats 16px above the bottom; the card isn't in the open sidebar; the bar fades out while the sidebar is open; the last paragraph scrolls clear of the bar.
- Reduced motion: no slide.
- Lighthouse on an essay page: Accessibility 100, CLS 0.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(site)/layout.tsx" docs/spec.md AGENTS.md
git commit -m "feat: announce new essays in the sidebar and on mobile"
```

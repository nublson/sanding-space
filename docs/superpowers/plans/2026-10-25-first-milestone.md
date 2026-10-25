# Sanding Space First Milestone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the §8 scaffold end to end: Notion-backed index, section and essay pages in the §9/§11 interface, one real demo (`button-press-scale`) that is embeddable anywhere with auto-height and oEmbed, interface sound, and content build checks.

**Architecture:** Next.js 16 App Router with Cache Components. A pure content layer (`src/lib/content`) turns Notion data-source rows into a typed `Library`; pages are Server Components that render it, plus a handful of small client islands (sound root, mute button, mobile sidebar, scroll-spy, live thumbnails, demos). Two route groups: `(site)` has the sidebar and sound, `demos` is chromeless.

**Tech Stack:** Next.js 16.4, React 19.3 (`<ViewTransition>`), TypeScript, Tailwind CSS v4, shadcn/ui `base-nova` (Base UI), lucide-react, notionic 0.10, @notionhq/client 5, @web-kits/audio 0.2, motion (demos only), Vitest + Testing Library + jsdom, Biome, pnpm.

**Spec:** `docs/spec.md` (§3–§8 behavior, §9 layout, §10 brand, §11 visual style, sound, motion). Read §9–§11 before any UI task.

## Global Constraints

- Read the relevant guide in `node_modules/next/dist/docs/` before using a Next API (AGENTS.md). `"use cache"` requires `cacheComponents: true`; `revalidateTag(tag, "max")` takes two arguments.
- Package manager pnpm; lint/format Biome (`pnpm lint`). Source in `src/`. Path alias `@/` → `src/`.
- Name: **Sanding Space**; titles `"<Page> · Sanding Space"`; domain lowercase `sanding.space`.
- Dark only: `<html class="dark">`, no `next-themes`, no theme toggle. Light tokens only under `.light` for demo embeds.
- Tokens, type and component values exactly as spec §11.2–§11.3 (copy the OKLCH values verbatim).
- UI kit: shadcn/ui `base-nova` on Base UI; never add Radix. Icons: lucide-react.
- `motion/react` only inside `src/components/demos/**`. Site chrome animates with CSS + `<ViewTransition>` only, and only `transform`, `opacity`, `color`, `background-color` (except sidebar expand via `grid-template-rows`).
- Sounds only from `src/lib/sounds.ts`; elements opt in with `data-sound`. Never on hover, focus, scroll or load. One sound per gesture.
- Essay status: Published → page; Soon → listed, not linked, no page (404); Draft → absent. Sections shown only if `Visible` and they have ≥1 Published or Soon essay.
- Reserved essay slugs: `demos`, `sections`, `api`, `about`, `rss`, `og`, `embed.js`, `sitemap.xml`, `robots.txt`, `opengraph-image`.
- Frame params `theme`, `bg`, `chrome` never reach a demo.
- `/demos/:path*` → `Content-Security-Policy: frame-ancestors *`; all else `frame-ancestors 'self'`; never `X-Frame-Options`.
- Accessibility: Lighthouse 100 on essay and demo pages; honor `prefers-reduced-motion`.
- Env: `NOTION_TOKEN`, `NOTION_SECTIONS_DATA_SOURCE_ID`, `NOTION_ESSAYS_DATA_SOURCE_ID`, `NEXT_PUBLIC_SITE_URL`, plus `REVALIDATE_SECRET` (new, Task 3).

## Review Focus

1. **More than 100 rows in a data source** → every section/essay still appears (queries must follow `has_more`/`next_cursor`). Test in Task 3.
2. **Bad demo params** (`?stiffness=abc`, `?scale=-4`, `?damping=`) → the demo falls back to its defaults and never animates with `NaN`. Test in Task 4.
3. **Visiting a Soon or Draft essay slug, or an unknown slug** → 404, never a rendered page. Test in Task 3 (`findPublishedEssay`) and Task 8.
4. **A non-Draft essay with no Slug or no Section** → it is left out of the site instead of crashing a page, and the build check reports it. Test in Task 3 and Task 10.
5. **Untrusted messages and URLs** → `embed.js` ignores `sanding:resize` messages from other origins or from windows that aren't a `data-sanding` iframe; `/api/oembed` answers 404 for URLs outside the site origin. Test in Task 9.

---

## File Structure

```
src/
  app/
    layout.tsx                      root: html.dark, fonts, globals (no chrome)
    globals.css                     tokens §11.2, utilities, light embed tokens
    (site)/layout.tsx               sidebar shell + SoundRoot + skip link
    (site)/page.tsx                 index /
    (site)/sections/[slug]/page.tsx section page
    (site)/[slug]/page.tsx          essay page
    (site)/not-found.tsx
    demos/[name]/page.tsx           chromeless demo
    demos/[name]/layout.tsx         applies theme/bg classes
    api/oembed/route.ts
    api/revalidate/route.ts
  components/
    ui/                             shadcn base-nova components (button only for now)
    brand/shaving-mark.tsx
    sidebar/sidebar.tsx             server: renders the list
    sidebar/mobile-shell.tsx        client: push toggle, inert, Escape
    sidebar/scroll-spy.tsx          client: index current section
    sound/sound-root.tsx            client: delegated data-sound listener
    sound/mute-button.tsx           client
    stage/demo-stage.tsx            stage surface
    stage/demo-frame.tsx            notionic components.demo override
    stage/live-thumbnail.tsx        client: mount demo when in view
    library/essay-card.tsx
    library/section-block.tsx       featured + grid (index and section page)
    demos/button-press-scale.tsx    client demo (motion)
    demos/retired-demo.tsx
    embed/resize-reporter.tsx       client: ResizeObserver → postMessage
  lib/
    content/types.ts
    content/parse.ts                Notion page → Section | Essay
    content/library.ts              buildLibrary, featuredEssay, find*
    content/notion.ts               client, queryAll, cached getters
    content/blocks.ts               firstParagraph, withoutDatabases, demoEmbeds
    content/links.ts                pageHref
    demos.ts                        registry, demos, resolveDemo
    frame-params.ts                 splitParams
    params.ts                       readNumber
    sounds.ts                       definitions, playSound, mute
    reserved.ts                     RESERVED_SLUGS
    oembed.ts                       buildOembed
    site.ts                         SITE_URL, SITE_NAME, title()
  test/setup.ts
public/embed.js
scripts/check-content.ts            CLI wrapper
src/lib/check-content.ts            pure checkContent
```

---

### Task 1: Foundation (deps, tokens, fonts, test harness)

**Files:**
- Modify: `package.json`, `src/app/layout.tsx`, `src/app/globals.css`, `next.config.ts`, `biome.json` (ignore `src/components/ui`)
- Create: `components.json`, `src/lib/utils.ts` (shadcn `cn`), `src/lib/site.ts`, `vitest.config.ts`, `src/test/setup.ts`, `src/lib/site.test.ts`, `.env.example`
- Delete: `src/app/page.tsx` (moves to `(site)` in Task 7), unused `public/*.svg`

**Interfaces:**
- Produces: `SITE_NAME = "Sanding Space"`, `SITE_URL: string` (from `NEXT_PUBLIC_SITE_URL`, default `https://sanding.space`, no trailing slash), `title(page?: string): string` in `src/lib/site.ts`; Tailwind tokens `bg-background`, `text-foreground`, `text-muted-foreground`, `text-subtle-foreground`, `bg-card`, `border-border`, `ring-ring`, `font-heading`, `font-mono`; utilities `.press`, `.link`, `.nudge-out`, `.nudge-back`, `.thumbnail`, `.skip-link`, keyframes `page-enter`, `stream-in`.

- [ ] **Step 1:** `pnpm add notionic @notionhq/client @web-kits/audio motion lucide-react tw-animate-css class-variance-authority clsx tailwind-merge` and `pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom tsx`. Run `pnpm dlx shadcn@latest init` choosing the Base UI variant of Nova (`base-nova`; confirm the exact style id in the CLI prompt), base color neutral, CSS variables; then set `components.json` aliases and `registries` exactly as spec §11.1. Add scripts `"test": "vitest run"`, `"typecheck": "tsc --noEmit"`.
- [ ] **Step 2:** Copy the portfolio's `vitest.config.ts` (jsdom, globals, `setupFiles: ["./src/test/setup.ts"]`, include `src/**/*.{test,spec}.{ts,tsx}`); `setup.ts` imports `@testing-library/jest-dom/vitest`.
- [ ] **Step 3: Write the failing test** `src/lib/site.test.ts`:

```ts
import { title, SITE_NAME } from "./site";
test("title formats page names", () => {
  expect(SITE_NAME).toBe("Sanding Space");
  expect(title("Button Press")).toBe("Button Press · Sanding Space");
  expect(title()).toBe("Sanding Space");
});
```

- [ ] **Step 4:** Run `pnpm test src/lib/site.test.ts` → FAIL (module not found). Implement `src/lib/site.ts`. Run again → PASS.
- [ ] **Step 5:** Write `globals.css`: import order from §11.1; `@custom-variant dark (&:is(.dark *));` the portfolio's `@theme inline` block with `--font-sans: var(--font-inter)`, `--font-heading: var(--font-newsreader)`, `--font-mono: var(--font-geist-mono)`, `--color-subtle-foreground`; `.dark` tokens = §11.2 dark table; `.light` tokens = portfolio `:root` values (§11.2 light line); body type from §11.2; the portfolio utilities and reduced-motion block listed in §11.2, copied from `nublson/nublson` `src/app/globals.css`.
- [ ] **Step 6:** `src/app/layout.tsx`: Inter (normal+italic), Newsreader (`axes: ["opsz"]`), Geist Mono via `next/font/google`; `<html lang="en" className="dark …font vars… h-full antialiased">`; `metadata.title = { template: "%s · Sanding Space", default: "Sanding Space" }`, `metadataBase: new URL(SITE_URL)`. `next.config.ts`: `cacheComponents: true`. `.env.example` lists the five env vars.
- [ ] **Step 7:** Run `pnpm lint && pnpm typecheck && pnpm test` → all pass.
- [ ] **Step 8: Commit** `git commit -m "chore: foundation tokens, fonts, shadcn base-nova and vitest"`

---

### Task 2: Brand mark and sidebar (server rendering)

**Files:**
- Create: `src/components/brand/shaving-mark.tsx`, `src/components/sidebar/sidebar.tsx`, `src/components/sidebar/sidebar.test.tsx`

**Interfaces:**
- Consumes: `LibrarySection`, `Essay` (Task 3 types; create `src/lib/content/types.ts` here if Task 3 is not done yet, exactly as Task 3 defines it).
- Produces:
  - `ShavingMark({ size = 18, className }: { size?: number; className?: string })`: the §10.1 path, `stroke="currentColor"`, `aria-hidden`.
  - `Sidebar({ sections, currentSectionSlug, currentEssaySlug, footer }: { sections: LibrarySection[]; currentSectionSlug: string | null; currentEssaySlug: string | null; footer: ReactNode })`: `<nav aria-label="Sections">`.

- [ ] **Step 1: Write failing tests** in `sidebar.test.tsx` with a fixture of two sections (Principles, Interaction with essays `button-press` Published, `hover-intent` Soon):
  - `collapsed sections link to their section page`: Principles is a link with `href="/sections/principles"`; its essays are not rendered.
  - `current section shows its question and essays`: with `currentSectionSlug="interaction"`, text "How should it respond?" is present and `button-press` is a link to `/button-press`.
  - `soon essays are plain text`: "Hover intent" exists and `queryByRole("link", { name: "Hover intent" })` is null.
  - `current essay is marked`: with `currentEssaySlug="button-press"`, that link has `aria-current="page"`.
  - `wordmark links home`: link named "Sanding Space" has `href="/"`.
- [ ] **Step 2:** `pnpm test src/components/sidebar` → FAIL.
- [ ] **Step 3:** Implement per spec §11.3 Sidebar (rows `h-7` / `pointer-coarse:h-11`, guide line, 2px × 12px bar via `before:` on the current link, Question 12/16 `text-subtle-foreground`). Sidebar section and essay links carry `data-sound="page"`. Wrap the current-essay bar in `<ViewTransition name="sidebar-marker">`. The expanded list uses a `grid-rows-[1fr]` wrapper (collapsed `0fr`) with `transition-[grid-template-rows] duration-200 ease-(--ease-out)`.
- [ ] **Step 4:** Tests → PASS. Commit `feat: shaving mark and sidebar`.

---

### Task 3: Content model and Notion data layer

**Files:**
- Create: `src/lib/content/{types,parse,library,notion,links}.ts`, `src/lib/reserved.ts`, tests `src/lib/content/{parse,library,notion,links}.test.ts`, fixtures `src/lib/content/__fixtures__/{section-page,essay-page}.json` (trimmed real `PageObjectResponse` shapes), `src/app/api/revalidate/route.ts`

**Interfaces:**
- Produces:

```ts
// types.ts
export type EssayStatus = "Published" | "Soon" | "Draft";
export type Section = { id: string; slug: string; name: string; question: string; order: number; visible: boolean };
export type Essay = { id: string; slug: string; title: string; summary: string; status: EssayStatus; order: number;
  sectionId: string | null; coverDemo: string | null; tags: string[]; published: string | null; updated: string; relatedIds: string[] };
export type LibrarySection = Section & { essays: Essay[] }; // Published + Soon, by order
export type Library = { sections: LibrarySection[]; bySlug: Map<string, { essay: Essay; section: LibrarySection }> };
```

  - `parseSection(page: PageObjectResponse): Section`, `parseEssay(page: PageObjectResponse): Essay` (property names exactly as spec §3.1/§3.2; ids normalized with notionic `normalizePageId`; blank text → `""`, missing number → `Infinity` for order).
  - `buildLibrary(sections: Section[], essays: Essay[]): Library` (pure).
  - `featuredEssay(section: LibrarySection): Essay | null`: first Published by order.
  - `findPublishedEssay(library: Library, slug: string)`: entry or `null` (Soon/Draft/unknown → null).
  - `queryAll(client: Pick<Client, "dataSources">, dataSourceId: string): Promise<PageObjectResponse[]>` follows `next_cursor`.
  - `getLibrary(): Promise<Library>` and `getBlocks(pageId: string): Promise<NotionBlock[]>`: both `"use cache"`, `cacheTag("notion")`, `cacheLife("minutes")`. The `minutes` profile expires well inside the 1-hour life of Notion's signed file URLs (spec §5), so images re-sign on revalidation; no proxy route this milestone.
  - `pageHref(library: Library): (pageId: string) => string | null`: essay → `/<slug>` (Published only), section → `/sections/<slug>`, else `null`.
  - `RESERVED_SLUGS: readonly string[]` (Global Constraints list).

- [ ] **Step 1: Write failing tests:**
  - `parse.test.ts`: fixtures parse to the expected objects; an essay with no Section relation has `sectionId: null`.
  - `library.test.ts`:
    - `drops drafts`: a Draft essay is not in any section and not in `bySlug`.
    - `hides invisible and empty sections`: `visible: false` → absent; visible with only Drafts → absent.
    - `orders sections and essays by order`.
    - `featured is never Soon`: section with [Soon order 1, Published order 2] → featured is the Published one; all Soon → `null`.
    - `skips essays without slug or section`: a Published essay with `slug: ""` or `sectionId: null` is absent (Review Focus 4).
    - `findPublishedEssay`: Published → entry; Soon, Draft, unknown → `null` (Review Focus 3).
  - `notion.test.ts` `queryAll follows pagination`: fake `dataSources.query` returns 100 rows `has_more: true, next_cursor: "c1"`, then 3 rows `has_more: false` → 103 rows, second call received `start_cursor: "c1"` (Review Focus 1).
  - `links.test.ts`: Published essay id → `/button-press`; Soon essay id → `null`; section id → `/sections/interaction`; unknown → `null`.
- [ ] **Step 2:** Run → FAIL. Implement the modules. `notion.ts` throws `Error("Missing env NOTION_TOKEN")` (and likewise for the data source ids) when unset.
- [ ] **Step 3:** `api/revalidate/route.ts`: `POST` with header `authorization: Bearer <REVALIDATE_SECRET>` → `revalidateTag("notion", "max")`, `200 {revalidated:true}`; otherwise `401`.
- [ ] **Step 4:** Tests → PASS. Commit `feat: notion content layer with caching and revalidation`.

---

### Task 4: Demo registry, params and the first demo

**Files:**
- Create: `src/lib/{demos,frame-params,params}.ts`, `src/components/demos/{button-press-scale,retired-demo}.tsx`, tests `src/lib/{demos,frame-params,params}.test.ts`, `src/components/demos/button-press-scale.test.tsx`

**Interfaces:**
- Produces:

```ts
// demos.ts
export type DemoEntry = { component: ComponentType<DemoProps>; title: string; essay: string; height: number; aliases?: string[]; retired?: boolean };
export const registry: Record<string, DemoEntry>; // "button-press-scale": title "Button press, scale", essay "button-press", height 320
export const demos: Demos;                          // derived; retired entries map to RetiredDemo
export function resolveDemo(name: string): { kind: "demo"; name: string; entry: DemoEntry } | { kind: "alias"; target: string } | { kind: "missing" };
// frame-params.ts
export type FrameParams = { theme: "light" | "dark" | "system"; bg: "default" | "transparent"; chrome: boolean };
export function splitParams(search: Record<string, string | string[] | undefined>): { frame: FrameParams; params: Record<string, string> };
// params.ts
export function readNumber(params: Record<string, string>, key: string, fallback: number, range: { min: number; max: number }): number;
```

- [ ] **Step 1: Write failing tests:**
  - `resolveDemo`: `"button-press-scale"` → demo; an alias in a test registry → `{ kind: "alias", target }`; `"nope"` → missing.
  - `splitParams({ stiffness: "500", theme: "light", chrome: "0", bg: "transparent" })` → frame `{ theme: "light", bg: "transparent", chrome: false }`, params `{ stiffness: "500" }`; invalid `theme=blue` → `"system"`; array values take the first.
  - `readNumber`: `"abc"`, `""`, missing → fallback; `"-4"` with `{min:0.5,max:1}` → clamped to `0.5`; `"450"` → `450` (Review Focus 2).
  - `button-press-scale.test.tsx`: renders a button named "Press and hold"; with `params={{ stiffness: "abc" }}` it renders without throwing.
- [ ] **Step 2:** Run → FAIL. Implement. Demo: `"use client"`, `motion.button` with `whileTap={{ scale }}` and `transition={{ type: "spring", stiffness, damping }}`; defaults stiffness 400, damping 30, scale 0.96, ranges stiffness 50–1000, damping 5–100, scale 0.5–1; `useReducedMotion()` → no scale. `RetiredDemo` renders "This demo has moved" with a link to `/<essay>`.
- [ ] **Step 3:** Tests → PASS. Commit `feat: demo registry, frame params and button-press-scale`.

---

### Task 5: Sound system and mute

**Files:**
- Create: `src/lib/sounds.ts`, `src/components/sound/{sound-root,mute-button}.tsx`, tests `src/lib/sounds.test.ts`, `src/components/sound/sound-root.test.tsx`

**Interfaces:**
- Produces:

```ts
export type SoundName = "tap" | "page" | "toggle-on" | "toggle-off";
export function playSound(name: SoundName): void;     // throttled 60 ms per name; no-op when muted
export function setMuted(muted: boolean): void;        // setMasterVolume(muted ? 0 : 1); localStorage "sanding:muted"
export function isMuted(): boolean;                    // reads localStorage, default false
```

  `SoundRoot({ children })` (client): one `click` listener on `document` that finds `closest("[data-sound]")` and plays it, ignoring elements with `aria-disabled="true"`. `MuteButton()` (client): 28px ghost icon button, `aria-pressed`, `aria-label` "Mute sound" / "Unmute sound", scales to 0.94 on press (§11.5), plays `toggle-off` then mutes after 150 ms, or unmutes then plays `toggle-on`; lucide `Volume2` / `VolumeX` crossfading per §11.5.

- [ ] **Step 1: Write failing tests** (mock `@web-kits/audio`: `defineSound` returns a `vi.fn()` per definition; `setMasterVolume` is a `vi.fn()`):
  - `definitions match the spec`: the object passed to `defineSound` for `tap` equals `{ source: { type: "triangle", frequency: { start: 1400, end: 900 } }, envelope: { decay: 0.035 }, gain: 0.12 }`; likewise `page`, `toggle-on`, `toggle-off` with the §11.4 values; every play is called with `{ jitter: { detune: 30, volume: 0.08 } }`.
  - `throttles repeats`: two `playSound("tap")` within 60 ms (fake timers) → one play; after 61 ms → two.
  - `mute`: `setMuted(true)` → `setMasterVolume(0)`, `localStorage["sanding:muted"] === "1"`, `playSound` no-ops.
  - `sound-root.test.tsx`: clicking a `<a data-sound="page">` plays `page` once; clicking a child `<span>` inside it also plays `page`; an element without `data-sound` plays nothing.
  - `mute button`: toggles `aria-pressed` and its accessible name.
- [ ] **Step 2:** Run → FAIL. Implement. **Step 3:** Tests → PASS. Commit `feat: interface sounds and mute button`.

---

### Task 6: Stage, demo frame, cards and section block

**Files:**
- Create: `src/components/stage/{demo-stage,demo-frame,live-thumbnail}.tsx`, `src/components/library/{essay-card,section-block}.tsx`, `src/lib/content/blocks.ts`, tests for `blocks.ts`, `essay-card`, `section-block`

**Interfaces:**
- Consumes: `LibrarySection`, `Essay`, `featuredEssay` (Task 3), `demos`, `registry` (Task 4).
- Produces:
  - `DemoStage({ size, children }: { size: "hero" | "card"; children?: ReactNode })`: §11.3 stage; hero `aspect-[2/1]`, card `aspect-[4/3]`.
  - `SiteDemoFrame(props: DemoFrameProps)`: stage + caption (notionic `RichText`), for `components.demo`.
  - `LiveThumbnail({ demo, essaySlug, size })`: client; renders `registry[demo].component` with `params={}` only after an `IntersectionObserver` reports it visible; fades in with `stream-in`; wraps the stage in `<ViewTransition name={\`demo-${essaySlug}\`}>`; missing demo → empty stage.
  - `EssayCard({ essay })`: Published → `<Link href="/<slug>" data-sound="page" className="press …">`; Soon → `<div>` with "Soon" badge, subtle text, no link.
  - `SectionBlock({ section, intro, headingLevel })`: heading (Newsreader 22/28), `intro` node, featured essay as hero `LiveThumbnail` + title/summary, remaining essays (excluding featured) in `grid-cols-3 max-sm:grid-cols-2`.
  - `firstParagraph(blocks: NotionBlock[]): NotionBlock[]` (first `paragraph` with non-empty text, or `[]`); `withoutDatabases(blocks)` (drops `child_database`, `link_to_page` to a database, and `unsupported`); `demoEmbeds(blocks): string[]` (names from embed URLs whose path ends `/demos/<name>`, recursing into `children`).
- [ ] **Step 1: Write failing tests:**
  - `blocks.test.ts`: `firstParagraph` skips an empty paragraph and a heading; `withoutDatabases` removes a `child_database`; `demoEmbeds` finds `button-press-scale` in a nested toggle and ignores `https://example.com/demos-x`.
  - `essay-card.test.tsx`: Soon essay has no link and shows "Soon"; Published links to `/button-press` with `data-sound="page"`.
  - `section-block.test.tsx`: featured essay appears once (not repeated in the grid); a section whose only Published essay is featured renders an empty grid without crashing.
- [ ] **Step 2:** Run → FAIL. Implement (LiveThumbnail mocked to a placeholder in the section-block test). **Step 3:** Tests → PASS. Commit `feat: demo stage, cards and section block`.

---

### Task 7: Site shell, mobile sidebar and pages

**Files:**
- Create: `src/app/(site)/layout.tsx`, `src/app/(site)/page.tsx`, `src/app/(site)/sections/[slug]/page.tsx`, `src/app/(site)/[slug]/page.tsx`, `src/app/(site)/not-found.tsx`, `src/components/sidebar/{mobile-shell,scroll-spy}.tsx`, `src/components/skip-link.tsx`, tests `mobile-shell.test.tsx`, `scroll-spy.test.tsx`

**Interfaces:**
- Consumes: everything from Tasks 2–6.
- Produces:
  - `MobileShell({ sidebar, children })` (client): below `md`, renders a fixed header (toggle button + wordmark) and the push layout; at `md`+, sidebar sticky beside content.
  - `ScrollSpy({ sectionSlugs, children })` (client): sets the expanded section in the sidebar to the section heading nearest the top (`IntersectionObserver` on `[data-section]` headings).
  - Pages export `generateStaticParams` (Published essays / visible sections) and `generateMetadata` using `title()`; essay pages add `alternates.types["application/json+oembed"]` (Task 9 endpoint URL).
- [ ] **Step 1: Write failing tests** `mobile-shell.test.tsx`:
  - toggle has `aria-expanded="false"` and `aria-controls` pointing at the sidebar id; clicking sets `"true"`, sets `inert` on the content wrapper, and moves focus into the sidebar.
  - Escape closes it and focus returns to the toggle; clicking a sidebar link closes it.
  - toggle carries `data-sound` `toggle-on` when closed and `toggle-off` when open.
  - `scroll-spy.test.tsx`: when the observer reports `interaction` visible, the sidebar receives `currentSectionSlug="interaction"`.
- [ ] **Step 2:** Run → FAIL. Implement. Push uses `translate-x` with a CSS `linear()` spring easing (~400 ms), no transition under reduced motion.
- [ ] **Step 3:** Pages:
  - `(site)/layout.tsx`: `getLibrary()`, `<SkipLink/>`, `SoundRoot`, `MobileShell` with `Sidebar` (footer: About link + `MuteButton`), `<main id="main-content" tabIndex={-1}>` at `max-w-[672px]`, main column wrapped in `<ViewTransition>` (200 ms crossfade, disabled under reduced motion via CSS on `::view-transition-*`).
  - `/`: one `SectionBlock` per section with `intro` = `NotionRenderer` of `firstParagraph(withoutDatabases(blocks))` + "Read more ↗" link (`.link .nudge-out`) to `/sections/<slug>`; blocks wrapped in `.article-layout` (page-enter).
  - `/sections/[slug]`: `notFound()` if absent; full `withoutDatabases(blocks)` intro then `SectionBlock`.
  - `/[slug]`: `findPublishedEssay` or `notFound()`; eyebrow, Newsreader title, summary, hero `DemoStage` with the essay's `coverDemo` wrapped in `<ViewTransition name={\`demo-${slug}\`}>`, then `NotionRenderer` with `demos`, `pageHref(library)`, `components={{ demo: SiteDemoFrame, child_database: () => null, unsupported: () => null }}`.
- [ ] **Step 4:** Tests → PASS; with a real `.env.local`, `pnpm build` prerenders `/`, `/sections/interaction` and `/button-press` (after the essay is set to Published in Notion). Commit `feat: site shell, mobile sidebar and pages`.

---

### Task 8: Standalone demo route

**Files:**
- Create: `src/app/demos/[name]/{layout,page}.tsx`, `src/components/embed/resize-reporter.tsx`, test `src/components/embed/resize-reporter.test.tsx`, `src/app/demos/[name]/page.test.tsx`

**Interfaces:**
- Consumes: `resolveDemo`, `registry` (Task 4), `splitParams` (Task 4), `ShavingMark` (Task 2), `SITE_URL` (Task 1).
- Produces: `ResizeReporter({ name, children })` (client): `ResizeObserver` on its root; when `window.self !== window.top`, posts `{ type: "sanding:resize", name, height }` to `parent` with target `"*"`.
- [ ] **Step 1: Write failing tests:**
  - `resize-reporter.test.tsx`: in an iframe-like setup (stub `window.top`), a resize posts `{ type: "sanding:resize", name: "button-press-scale", height: 320 }`; at top level nothing is posted.
  - `page.test.tsx` (render the page component with `params`/`searchParams` promises): `chrome=0` hides the "Sanding Space" attribution; default shows a link to `/button-press` with `target="_blank"`; unknown name calls `notFound`; alias calls `permanentRedirect("/demos/<target>?<query>")` with the query preserved.
- [ ] **Step 2:** Run → FAIL. Implement: `theme=system` → `.dark` plus `@media (prefers-color-scheme: light)` applying the `.light` tokens; `light` → `.light`; `bg=transparent` → transparent `html` and `body`; demo centered on a stage; attribution bottom-right (12px subtle) per §11.6; `metadata.alternates.canonical` = `${SITE_URL}/demos/<name>` and the oEmbed alternate link; `generateStaticParams` over registry names. No `SoundRoot`, no page entrance.
- [ ] **Step 3:** Tests → PASS. Commit `feat: standalone embeddable demo route`.

---

### Task 9: Frame headers, embed.js and oEmbed

**Files:**
- Modify: `next.config.ts`
- Create: `public/embed.js`, `src/lib/oembed.ts`, `src/app/api/oembed/route.ts`, tests `src/lib/oembed.test.ts`, `src/lib/embed-script.test.ts`, `src/lib/headers.test.ts`

**Interfaces:**
- Consumes: `registry`, `resolveDemo` (Task 4), `getLibrary` (Task 3), `SITE_URL`.
- Produces: `buildOembed(input: { url: string; maxwidth?: number; maxheight?: number }, ctx: { siteUrl: string; registry: Record<string, DemoEntry>; library: Library }): OembedResponse | null`; `next.config.ts` exports `headers()` as below.
- [ ] **Step 1: Write failing tests:**
  - `oembed.test.ts`:
    - demo URL → `{ version: "1.0", type: "rich", provider_name: "Sanding Space", provider_url: siteUrl, title: "Button press, scale", width: 640, height: 320, html: <iframe … data-sanding … title="Button press, scale · Sanding Space"> + <script async src="<siteUrl>/embed.js"> }`.
    - `maxwidth=400` → `width` 400; `maxheight=200` → `height` 200.
    - Published essay with cover demo → rich embed of that demo with the essay title; essay without cover → `type: "link"`.
    - URL on another origin, Soon essay, unknown path → `null` (route answers 404; Review Focus 5). Missing `url` → route 400.
  - `embed-script.test.ts` (load `public/embed.js` into jsdom): a `message` with `data {type:"sanding:resize",height:500}` from origin `https://sanding.space` whose `source` is an iframe marked `data-sanding` sets its height to `500px`; same message from another origin, or from a non-`data-sanding` frame, changes nothing.
  - `headers.test.ts`: `headers()` returns `frame-ancestors *` for `/demos/:path*` and `frame-ancestors 'self'` for `/((?!demos/).*)`, and no `X-Frame-Options` anywhere.
- [ ] **Step 2:** Run → FAIL. Implement. `embed.js`: plain ES2017, no dependencies, IIFE, allowed origin `https://sanding.space` (plus `location.origin` when served from localhost for dev). Route `GET /api/oembed?url=&maxwidth=&maxheight=&format=json` (`format` other than `json` → 501).
- [ ] **Step 3:** Tests → PASS. Commit `feat: frame headers, embed.js auto-height and oEmbed`.

---

### Task 10: Build checks

**Files:**
- Create: `src/lib/check-content.ts`, `src/lib/check-content.test.ts`, `scripts/check-content.ts`
- Modify: `package.json` (`"check:content": "tsx --env-file=.env.local scripts/check-content.ts"`, `"prebuild": "pnpm check:content"`)

**Interfaces:**
- Consumes: `Section`, `Essay` (Task 3), `registry` (Task 4), `RESERVED_SLUGS`, `demoEmbeds` (Task 6).
- Produces: `checkContent(input: { sections: Section[]; essays: Essay[]; embedsByEssay: Record<string, string[]>; registry: Record<string, DemoEntry> }): { errors: string[]; warnings: string[] }`. Each message names the essay/section slug (or title when the slug is blank) and the rule.
- [ ] **Step 1: Write failing tests**, one per §7 rule, each building a minimal valid input and breaking one thing:
  1. embed of an unregistered demo in a non-Draft essay → error; in a Draft → nothing; an alias name → nothing.
  2. `coverDemo` not in registry (or aliases) → error.
  3. duplicate essay slug → error; slug `"api"` → error; blank slug on non-Draft → error.
  4. duplicate section slug → error.
  5. non-Draft essay with `sectionId: null` or an unknown section id → error.
  6. demo name equal to another demo's alias → error.
  7. registry `essay` pointing at a missing or Draft slug → error; at a Soon slug → warning only.
  - a valid input → `{ errors: [], warnings: [] }`.
- [ ] **Step 2:** Run → FAIL. Implement. `scripts/check-content.ts` fetches both data sources (`queryAll`), parses, fetches blocks for non-Draft essays (`fetchBlocks`, `bookmarkPreviews: false`), runs `checkContent`, prints warnings, prints errors and `process.exit(1)` if any.
- [ ] **Step 3:** Tests → PASS; `pnpm check:content` against real Notion prints no errors (or real ones to fix in Notion). Commit `feat: content build checks`.

---

### Task 11: README and milestone verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1:** README: what Sanding Space is; setup (`pnpm i`, `.env.local` from `.env.example`, connect the Notion integration to the Library page); scripts; how to add a demo (component in `src/components/demos/<name>.tsx`, registry entry, names are permanent, renames via `aliases`, never use `theme`/`bg`/`chrome` params); how to embed (iframe + `embed.js` snippet from spec §6.6, oEmbed URL); revalidation (`POST /api/revalidate` with the bearer secret).
- [ ] **Step 2:** Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build` → all pass.
- [ ] **Step 3:** Verify the §8 acceptance criteria that can be checked locally with `pnpm start`:
  - `/button-press` renders with the demo inline (essay set to Published in Notion).
  - `curl -s "localhost:3000/api/oembed?url=https://sanding.space/demos/button-press-scale"` returns the JSON from Task 9.
  - `curl -sI localhost:3000/demos/button-press-scale | grep -i frame-ancestors` → `*`; same for `/` → `'self'`.
  - A plain HTML file served from another port iframes `/demos/button-press-scale` with `embed.js` and resizes.
  - The index page's JS chunks contain no `motion` code when no section shows a live demo; `/demos/button-press-scale` loads only that demo.
  - Lighthouse accessibility = 100 on `/button-press` and `/demos/button-press-scale`.
- [ ] **Step 4:** Commit `docs: readme for setup, demos and embeds`. The §11.8 quality gates (`better-interface`, `find-animation-opportunities`, `improve`) run after this plan, on the built milestone.

# Sanding Space: build spec

This document is the brief for building **Sanding Space** (`sanding.space`), a library of short essays about design engineering and product engineering, where every essay contains live, interactive demos that can also be embedded anywhere on the web.

Read the whole document before writing code. Decisions marked **(decided)** are final; anything marked **(suggested)** can be adjusted if you find a better approach, but say so.

---

## 1. Product summary

- **Essays** are written in Notion and rendered on the site with [notionic](https://notionic.dev) (React Server Components renderer for the Notion API, by the same author).
- **Demos** are React components that live in the repo. They are placed inside essays by embedding a URL ending in `/demos/<name>` in Notion.
- Every demo also has a **standalone, chromeless, embeddable URL** (`sanding.space/demos/<name>`) that can be iframed on any site, pasted into oEmbed-aware editors, and previewed inside the Notion editor.
- Essays are grouped into **sections** (Principles, Foundations, Interaction, Motion, Components, Systems, Product).

### Naming conventions (decided)

- Full name: **Sanding Space**. Use it in the wordmark, page titles and meta tags, e.g. `Button Press · Sanding Space`.
- Domain: always lowercase, `sanding.space`.

---

## 2. Stack (decided unless noted)

- Next.js (App Router), TypeScript, React Server Components
- Tailwind CSS v4 + shadcn/ui on **Base UI** primitives (decided, see §11.1)
- `@web-kits/audio` for interface sound (decided, see §11.4)
- `notionic` + `@notionhq/client`
- Motion (`motion/react`) for demo animation (suggested)
- Deploy on Vercel
- Optional, for embed analytics: Vercel Analytics custom events or a small Supabase table (suggested)

### Environment variables

```
NOTION_TOKEN=                       # Notion integration token with access to the Sanding Space teamspace
NOTION_SECTIONS_DATA_SOURCE_ID=f38f8100-846a-4076-953e-296370a910d2
NOTION_ESSAYS_DATA_SOURCE_ID=92208a07-e0f7-4a67-94d6-a220d3529348
NOTION_RESOURCES_DATA_SOURCE_ID=3756f20a-f849-489e-8571-51858d7b8cbc
NOTION_INTRODUCTION_PAGE_ID=405b1726-8ab3-81f0-9d46-ef735904da9e
NOTION_ABOUT_PAGE_ID=
NEXT_PUBLIC_SITE_URL=https://sanding.space
```

The Notion integration must be connected to the **Library** page (or the whole teamspace) so it can read both databases and their pages.

---

## 3. Notion content model (already created)

The databases live under a page called **Library** in the Sanding Space teamspace. Use **data source IDs** (Notion API 2025-09-03+) when querying.

| Database | Database ID | Data source ID |
|---|---|---|
| Sections | `2fd8c999c699433485fde2b2fdea1ac4` | `f38f8100-846a-4076-953e-296370a910d2` |
| Essays | `aa48ccb1566c4a75b6912f62717ac4e1` | `92208a07-e0f7-4a67-94d6-a220d3529348` |
| Resources | | `3756f20a-f849-489e-8571-51858d7b8cbc` |

### 3.1 Sections

| Property | Type | Notes |
|---|---|---|
| Name | title | Display name |
| Slug | text | URL id, e.g. `interaction` |
| Question | text | The question the section answers; render as the section subtitle / meta description |
| Order | number | Sidebar and index order (ascending) |
| Visible | checkbox | Only `true` sections appear on the site |
| Essays | relation → Essays | Two-way with Essays.Section |
| Count | rollup | Count of related essays (Notion-side convenience, don't rely on it in code) |
| *Page body* | | Section intro (render with notionic) **followed by a linked database view of Essays**. The linked view must be skipped when rendering (render nothing for that block). |

Current sections:

| Order | Name | Slug | Question |
|---|---|---|---|
| 1 | Principles | `principles` | How should I think? |
| 2 | Foundations | `foundations` | How should it look? |
| 3 | Interaction | `interaction` | How should it respond? |
| 4 | Motion | `motion` | How should it move? |
| 5 | Components | `components` | How do I build one thing really well? |
| 6 | Systems | `systems` | How do I make it scale? |
| 7 | Product | `product` | How do I make it useful? |

All sections currently have `Visible = false`. Do not hardcode this list; read it from Notion.

### 3.2 Essays

| Property | Type | Notes |
|---|---|---|
| Title | title | |
| Slug | text | Unique across all essays. URL: `sanding.space/<slug>` |
| Section | relation → Sections | Limited to one page |
| Status | status | `Draft` / `Soon` / `Preview` / `Published` |
| Order | number | Order within its section |
| Summary | text | Card text and meta description |
| Cover demo | text | A demo name (e.g. `button-press-scale`) rendered live, scaled down, as the index card thumbnail |
| Tags | multi-select | Cross-cutting topics: `Accessibility`, `Performance` |
| Published | date | |
| Updated | last edited time | Automatic |
| Related | relation → Essays | Self-relation, may cross sections |
| *Page body* | | The essay. Demos are `/embed` blocks whose URL ends in `/demos/<name>` |

### 3.3 Status rules (decided)

- `Published`: essay page is live, listed normally.
- `Soon`: listed in the index and sidebar with a "Soon" treatment (muted, not clickable), no essay page (404 or not generated).
- `Preview`: behaves exactly like `Published` locally, in `next dev` and on Vercel preview deployments, and like `Draft` in production (`VERCEL_ENV=production`). Used to review an essay before publishing it (decided).
- `Draft`: invisible on the site. Optionally viewable via Next.js draft mode for previewing.

A section is shown only if `Visible = true` **and** it has at least one `Published` or `Soon` essay (decided). Empty visible sections are hidden everywhere (index, sidebar, `/sections/<slug>` returns 404).

### 3.4 Resources

Tools and references the site keeps coming back to, shown on `/resources` (§9.6).

| Property | Type | Notes |
|---|---|---|
| Name | title | Display name |
| URL | url | Where the row links to (external, new tab); its host's favicon is the row icon |
| Description | text | One line, after the name |
| Category | select | The group the row sits under. **The options' order in Notion is the category order on the page** (drag the options inside the property to reorder); there is no separate number (decided) |
| Order | number | Order within its category (ascending) |
| Visible | checkbox | Only `true` rows appear on the page; a database without this column shows every row |
| *Database description* | | The page's one-line intro (decided) |

Current categories, top to bottom: My Purls, Learning, Inspiration. Do not hardcode them; read them from the Category property.

The code finds each column by the name above, or else by the first column of that type, so a renamed column still parses (`parseResource` in `src/lib/content/parse.ts`). A row shows only when Visible, with a name, a URL and a Category that is one of the options; a category shows only when it has at least one such row.

The references block at the end of each essay (the resources an essay draws from) is out of the first milestone.

---

## 4. Routes and URLs

| What | URL | Notes |
|---|---|---|
| Home | `/` | Redirects (307, temporary) to `/introduction` (decided) |
| Introduction | `/introduction` | Default page: a standalone Notion page (§9.2). Sidebar label and path fixed in code, page id from env, heading from the page (decided) |
| Essay | `/<slug>` | Flat URL (decided). Section shown in UI/breadcrumb only, so moving an essay between sections never breaks a link |
| Section | `/sections/<slug>` | Section intro + its essays |
| Resources | `/resources` | Tools and references by category, from the Resources database (§3.4, §9.6). Linked from the sidebar footer, above About |
| Demo | `/demos/<name>` | Standalone, chromeless, embeddable. **Permanent URL** |
| Demo OG image | `/demos/<name>/opengraph-image` | Generated; essays and sections have their own, the root one is the fallback |
| Sitemap, robots, manifest | `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | Generated from the library and the demo registry |
| Agent surfaces | `/llms.txt`, `/api/mcp`, `/api/a2a`, `/openapi.json`, `/auth.md`, `/.well-known/*` | Any page as Markdown on `Accept: text/markdown`; MCP and A2A servers; discovery manifests (`src/lib/agents/`) |
| oEmbed | `/api/oembed` | |
| Embed helper | `/embed.js` | Auto-height script |

### Reserved slugs (decided)

Essay slugs must not be any of: `demos`, `sections`, `api`, `about`, `resources`, `introduction`, `rss`, `og`, `embed.js`, `sitemap.xml`, `robots.txt`, `opengraph-image`, `favicon.ico`, `icon0.svg`, `icon1`, `icon2`, `apple-icon`, `manifest.webmanifest`, `llms.txt`, `auth.md`, `openapi.json`, `.well-known`. Add any new top-level route to this list.

### Linking between Notion pages

Use notionic's `pageHref` so links to other essays inside an essay resolve to `/<slug>`, and links to section pages resolve to `/sections/<slug>`. Unknown pages render as plain text or `null` (no broken links).

---

## 5. Data fetching and caching

- Query **Sections** (filter `Visible = true`, sort `Order` asc) and **Essays** (filter `Status != Draft`, sort by Section then `Order`).
- Fetch page bodies with `fetchBlocks(notion, pageId)` from `notionic/fetch` and render with `<NotionRenderer />`.
- Cache with Next.js (`"use cache"` / `cacheTag`, or `revalidate`). Suggested: time-based revalidation (e.g. 60s to 5 min) plus a tag-based on-demand revalidation endpoint that can later be called by a Notion webhook.
- Generate essay and section pages statically with `generateStaticParams`.
- Notion file URLs expire. If essays include Notion-hosted images, handle that (re-fetch on revalidation, or proxy/copy images). Prefer hosting demo-related media in the repo.

---

## 6. Demo layer (the core of the product)

### 6.1 How notionic demos work (reference)

- A demo is a component receiving `DemoProps` (`name`, `params`). Make it a Client Component (`"use client"`) when it uses state or animation.
- `<NotionRenderer blocks={blocks} demos={demos} />` renders any Notion embed whose URL path ends in `/demos/<name>` as that component. Only the path counts, so the same embed works on localhost, previews and production.
- The embed URL's query string reaches the demo as `params` (`?speed=slow` → `{ speed: "slow" }`).
- Unknown names render as links, so a typo never breaks a page.
- The frame around a demo can be replaced with `components.demo` (receives `children`, `name`, `caption`, `context`; render the caption with `RichText`).
- Docs: https://notionic.dev/docs/demos

### 6.2 URL contract (decided)

```
sanding.space/demos/button-press-scale?stiffness=400&theme=dark
                    └──── name ──────┘ └ demo params ┘ └ frame params ┘
```

Reserved **frame params**, consumed by the route and **not** passed to the demo:

| Param | Values | Default |
|---|---|---|
| `theme` | `light` / `dark` / `system` | `system` |
| `bg` | `default` / `transparent` | `default` |
| `chrome` | `0` hides the attribution mark | shown |

All other query params are passed to the demo as `params`. Demo authors must not use the reserved names.

### 6.3 Registry (source of truth for demos)

Keep a richer registry and derive notionic's `Demos` map from it.

```ts
// lib/demos.ts
export const registry = {
  "button-press-scale": {
    component: ButtonPressScale,
    title: "Button press, scale",
    essay: "button-press",        // optional: canonical essay slug for the "Read the essay" link; omit while the demo has no essay (links go to `/`)
    height: 320,                  // fallback iframe height before auto-height runs
    aliases: ["button-scale"],    // old names, 308-redirect to the current name
  },
} satisfies Registry

export const demos: Demos = mapValues(registry, (d) => d.component)
```

Rules (decided):

- Demo names are **permanent**. Renaming means adding the old name to `aliases`, which 308-redirects `/demos/<old>` → `/demos/<new>` (preserve the query string).
- Demos are never deleted. A retired demo renders a small "This demo has moved" card linking to the essay.
- Each demo lives in `components/demos/<name>.tsx`.

### 6.4 `/demos/[name]` page

- Chromeless: the demo centered on a stage, plus a small "Sanding Space ↗" mark in a corner linking to `/<essay>` (hidden with `chrome=0`). Open the link in a new tab (`target="_blank"`), since it usually runs inside someone else's page.
- Prerender every demo with `generateStaticParams` over the registry.
- Only that demo's JavaScript ships.
- Apply `theme` and `bg`. With `bg=transparent`, `html` and `body` must be transparent.
- Respect `prefers-reduced-motion`, and `prefers-color-scheme` when `theme=system` (§11.6).
- `notFound()` for unknown names (after checking aliases).
- `<meta name="robots" content="noindex">` is **not** wanted; demos should be indexable, but set the canonical URL to the demo URL itself.

### 6.5 Headers (decided)

In `next.config`:

- `/demos/:path*` → `Content-Security-Policy: frame-ancestors *` (and no `X-Frame-Options`).
- All other routes → `Content-Security-Policy: frame-ancestors 'self'`.

### 6.6 Auto-height

Inside the demo page, a `ResizeObserver` on the demo root posts its height to the parent:

```ts
parent.postMessage({ type: "sanding:resize", name, height }, "*")
```

`public/embed.js` (small, no dependencies) listens for `sanding:resize` messages, matches `event.source` to iframes marked `data-sanding`, and sets their height. Verify the message origin is `https://sanding.space`.

Copy-paste embed code:

```html
<iframe src="https://sanding.space/demos/button-press-scale"
  data-sanding loading="lazy" style="width:100%;height:320px;border:0"
  title="Button press, scale · Sanding Space"></iframe>
<script async src="https://sanding.space/embed.js"></script>
```

Without the script, the iframe uses the inline height (from the registry `height`).

### 6.7 oEmbed

- `GET /api/oembed?url=<sanding.space URL>&maxwidth=&maxheight=&format=json`
- For a demo URL: return `type: "rich"`, `html` (the iframe), `width`, `height` (from registry), `title`, `provider_name: "Sanding Space"`, `provider_url`.
- For an essay URL: return a `rich` response embedding its cover demo, or `link` type if it has none.
- Advertise discovery on both essay and demo pages:
  `<link rel="alternate" type="application/json+oembed" href="https://sanding.space/api/oembed?url=…">`
- After launch (manual task, not code): register with Iframely and the oembed.com provider list.

### 6.8 Social previews

- Each demo gets an OG image at `/demos/[name]/opengraph-image`.
- Preferred: a real screenshot of the demo captured with Playwright in CI on each deploy and stored as a static asset; fall back to a generated image (title + Sanding Space wordmark) when no screenshot exists.
- Essay OG images are typographic: section, title (Newsreader) and summary on the silicon-carbide card. The cover demo screenshot waits for a screenshot pipeline (deferred).

### 6.9 Demo frame inside essays

Override `components.demo` with a Sanding Space frame:

- Stage with the demo, caption from Notion centered below (via `RichText`). No actions on the frame for now (decided).
- **Deferred** until there is a real need: actions revealed on hover/focus (and always visible on touch). Keep this as the reference when they come back:
  - **Replay**: remount the demo by changing its `key` (important for motion demos that play once).
  - **Copy link**: `https://sanding.space/demos/<name>` plus any non-frame params from the embed.
  - **Copy embed**: the iframe + script snippet above.
  - **Open**: the standalone demo page in a new tab.
- Actions must be keyboard accessible with visible focus states.

### 6.10 Embed analytics (suggested)

Inside the demo page, when running in an iframe (`window.self !== window.top`), record a view event with the demo name and `document.referrer` (the embedding page). Use Vercel Analytics custom events or a Supabase table. Goal: know which demos spread and which sites send readers back.

---

## 7. Build checks (decided)

Run in CI before deploy; fail the build on any error:

1. Every `/demos/<name>` embed found in a non-Draft essay body exists in the registry (or its aliases).
2. Every essay's `Cover demo` exists in the registry.
3. Essay slugs are unique and not in the reserved list.
4. Section slugs are unique.
5. Every non-Draft essay has exactly one Section, and that section exists.
6. Demo names and aliases don't collide with each other.
7. Every registry `essay` value, when set, points to an existing, non-Draft essay slug (warn, don't fail, if it points to a `Soon` or `Preview` essay). Demos without an `essay` are skipped.

---

## 8. First milestone (scaffold)

Deliver, end to end:

1. Next.js app with Tailwind, shadcn/ui tokens, notionic styles imported after Tailwind (import order in §11.1), dark-only site with light tokens for embeds (§11).
2. Notion data layer reading Sections and Essays with the rules in §3 and §5.
3. Routes: `/`, `/<slug>`, `/sections/<slug>`, `/demos/<name>`.
4. Demo registry with **one real demo**, `button-press-scale` (a button that scales down on press with a spring and returns on release; params: `stiffness`, `damping`, `scale`). Essay slug: `button-press` (already exists in Notion as a Draft in the Interaction section).
5. Headers (§6.5), `embed.js` auto-height (§6.6), oEmbed endpoint (§6.7).
6. Custom demo frame: stage + caption only (§6.9; actions deferred). Interface layout per §9.
7. Build checks script (§7) wired to `pnpm build` or a separate CI step.
8. README covering setup, env vars, how to add a demo, and how to embed one.

### Acceptance criteria

- Embedding `https://sanding.space/demos/button-press-scale` in a Notion page shows the live demo in the Notion editor (after deploy).
- The `button-press` essay, once set to Published, renders at `/button-press` with the demo inline and working.
- The demo iframe works on an external test page (a plain HTML file on another origin) and auto-resizes with `embed.js`.
- `/api/oembed?url=https://sanding.space/demos/button-press-scale` returns valid oEmbed JSON.
- Pages without demos ship no client JavaScript for demos.
- Lighthouse accessibility score of 100 on the essay and demo pages.

---

## 9. Interface layout (decided)

Agreed through low-fidelity mocks (direction "Contents", inspired by devouringdetails.com). Visual style (type, color, spacing) is not decided yet; this section fixes structure only.

### 9.1 Sidebar (one component, all sizes)

- Top: the wordmark (shaving mark + **Sanding Space**, §10), linking to `/introduction`.
- Then the fixed **Introduction** item (`/introduction`), marked current on that page (decided).
- Sections in `Order`, collapsed to their name. Collapsed sections link to `/sections/<slug>`.
- The **current section** is expanded: its name, its `Question` (small, muted) below it, then its essays (`Published` and `Soon`) behind a thin vertical guide line.
- The essay being read is marked with a short bar in the brand color on the guide line. `Soon` essays are muted and not clickable.
- Footer pinned to the bottom: **Resources** and **About** links (Resources above About) and a **mute** button (sound on by default, §11.4). The site is dark only; there is no theme toggle.
- Current item from the URL: on an essay page, the essay's section and the essay; on `/sections/<slug>`, that section; on `/introduction`, the Introduction item with no section expanded.
- Desktop: always visible, sticky beside the content.

### 9.2 Introduction `/introduction` (decided)

The default page: `/` redirects here (temporary 307, so the home page can change later). Its sidebar label ("Introduction") and path are fixed in code (`src/lib/standalone.ts`); the Notion page id of a standalone page (not part of the Sections or Essays databases) comes from `NOTION_INTRODUCTION_PAGE_ID`. It is laid out exactly like a section page: the Notion page's title as the heading, then the page body rendered with notionic; the document title is the Notion title too. Links in essays to that Notion page resolve to `/introduction`.

The earlier index (every section with its intro paragraph and cards) is replaced by this page; sections are reached from the sidebar.

**About** (`/about`, linked from the sidebar footer) is the colophon: who makes the site, how it is built, what readers may do with the demos, where to find the author. Same mechanism as the Introduction: a standalone Notion page named by `NOTION_ABOUT_PAGE_ID`, heading and document title from the page (decided).

### 9.3 Section page `/sections/<slug>`

The section name, its **full** intro (Notion page body, skipping the linked Essays database view), then its **first essay by `Order`** as a large card and the remaining essays in a 3-column card grid (`SectionBlock`) (decided). The large slot is not limited to `Published`: a `Soon` first essay shows a large empty stage and is not a link. A Soon card carries no badge: the empty stage and the muted title and summary say it, and the title ends with a screen-reader-only "(coming soon)" (decided).

### 9.4 Essay `/<slug>`

- Section name as a small eyebrow above the title.
- A large demo stage (the first demo in the body, or the `Cover demo`) with its caption centered below.
- Essay body below a hairline; inline demos use the same stage + caption frame (§6.9), without actions.

### 9.5 Mobile

- Header identical to the desktop wordmark, with a **sidebar toggle button before the logo**. The header stays fixed.
- The sidebar is the same component (sections, Question, essays, About + mute footer). It lives off-canvas on the left; the toggle **pushes** the content to the right (no overlay), leaving part of the page visible.
- While open: the visible content is inert and tapping it closes the sidebar; Escape closes it; focus moves into the sidebar; choosing a link closes it and navigates. The toggle exposes `aria-expanded`. With reduced motion, open/close without the slide.
- The essay hero demo runs edge to edge; the card grid drops to 2 columns.

### 9.6 Resources `/resources`

Laid out like a section page (reference: craft.gustavofior.com/resources): the **Resources** heading, the one-line intro from the database description, then each category in the order of the Category property's options as a heading over a list, one row per resource by `Order`. A row is the destination's favicon, the name (foreground), a middle dot and the description (muted); the whole row is the link, opening in a new tab. Label ("Resources") and path are fixed in code (`src/lib/content/resources.ts`); everything else comes from the database (§3.4).

---

## 10. Brand (decided)

### 10.1 Mark

The **shaving**: a single curl of material lifted off the work, hinting at an S without spelling it. Used before the wordmark in the sidebar/header and alone as the favicon.

```svg
<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 34C6 18 26 6 37 15C46 23 38 37 27 35C19 33 20 22 28 23"
        fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
</svg>
```

- Always `currentColor`, so it follows the theme. Never recolor it per section.
- Static. No logo animation.
- Lockup: mark + **Sanding Space** in the UI font, mark height ≈ cap height × 1.4.

### 10.2 Color: silicon carbide (monochrome)

Named after the near-black of wet-and-dry sandpaper. There is **no accent hue**: the brand color is the ink. Anything that would be "accent" (current-essay bar, links, focus ring) uses the foreground color; hierarchy comes from weight, size and the muted tones, not color. Demos may use color internally; the site chrome does not.

The site is **dark only**. The exact token values are the ones from the author's portfolio (nublson.com, achromatic OKLCH) and are listed in §11.2.

---

## 11. Visual style and feedback (decided)

Goal: a focused, refined space that feels alive. The interface answers every press with motion and sound; reading stays calm. The visual system is the author's portfolio ([nublson.com](https://nublson.com), repo `nublson/nublson`), adapted to a sidebar layout and extended with sound.

### 11.1 Foundation

- shadcn/ui with **Base UI** primitives: the Base UI variant of the portfolio's Nova style (`base-nova`; the portfolio itself uses `radix-nova`). Same `components.json` otherwise: `rsc: true`, `baseColor: neutral`, CSS variables, aliases `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`, `iconLibrary: lucide`, and the `@notionic` registry (`https://notionic.dev/r/{name}.json`).
- `globals.css` imports, in order: `tailwindcss`, `tw-animate-css`, `shadcn/tailwind.css`, `notionic/styles.css`.
- **Dark only.** No `next-themes`, no theme toggle; `<html class="dark">`. Light tokens exist only for demo embeds (§11.6).

### 11.2 Type and tokens

Fonts via `next/font/google`: **Inter** (`--font-sans`, normal + italic), **Newsreader** (`--font-heading`, `opsz` axis), **Geist Mono** (`--font-mono`).

Body: `font-size: 16px; line-height: 26px; letter-spacing: -0.008em; font-feature-settings: "cv11", "ss01"`, chrome and reading text alike. Text fills the 672px column (about 85 characters per line), so paragraphs and stages share one right edge (decided). Notion body headings h2 and h3 share the page title's size, Inter 500 at 16/24, h4 and h5 at 14/22, all in `foreground` over muted copy; the essay summary is a lede at 18/28. **Below `md` every size steps down two pixels**: body 14/22 (tracking -0.006em), page titles 14 on a 28px line, sidebar rows 28px (44 on touch), question 12/16, card titles 14 with 13/20 summaries, eyebrow and captions 13, lede 16/26, essay title 28/34, body headings 14/20 and 12/18, inline code 0.875em of the body (decided). External links in Notion text carry the destination's favicon before the text, through notionic's `linkFavicons` (fetched once per host at build/revalidation and inlined with the blocks, a muted globe for a site without one); links to `sanding.space` itself show no icon (decided). The Resources page, whose rows are not Notion text, still uses `/api/favicon`, which proxies Google's favicon service and serves raster images only, sandboxed.

Dark tokens (site):

| Token | Value | Contrast on background |
|---|---|---|
| `--background` | `oklch(0.178 0 0)` | |
| `--foreground` (ink, brand) | `oklch(0.946 0 0)` | 16.1:1 |
| `--muted-foreground` (body text, intros) | `oklch(0.7 0 0)` | 7.1:1 |
| `--subtle-foreground` (labels, Question, captions, Soon) | `oklch(0.64 0 0)` | 5.6:1 |
| `--card` / `--muted` / `--secondary` / `--accent` / `--popover` (stage, hover) | `oklch(0.218 0 0)` | |
| `--border` | `oklch(0.248 0 0)` | |
| `--input` | `oklch(0.27 0 0)` | |
| `--ring` (focus) | `oklch(0.7 0 0)` | 7.1:1 |
| `--primary` / `--primary-foreground` | `oklch(0.922 0 0)` / `oklch(0.205 0 0)` | |

Light tokens (embeds only): the portfolio's `:root` values, e.g. background `oklch(0.985 0 0)`, foreground `oklch(0.205 0 0)` (17.2:1), muted `oklch(0.439 0 0)` (7.5:1), subtle `oklch(0.55 0 0)` (4.65:1), card `oklch(0.955 0 0)`, border `oklch(0.94 0 0)`, ring `oklch(0.556 0 0)`.

Radius `--radius: 0.625rem` with the portfolio's `--radius-*` scale. Easing `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`. Utilities carried over: `.skip-link`, `:focus-visible` ring (2px, offset 2px, `ring`), `.thumbnail` (10px radius), `.link`, `.press`, `.nudge-out` / `.nudge-back`, `page-enter` and `stream-in` keyframes, and the global `prefers-reduced-motion` override.

### 11.3 Components

**Sidebar** (structure in §9.1)
- 160px wide, sticky, 32px top padding; 32px gap to the content.
- Wordmark: shaving mark 20px + "Sanding Space", Inter 16 medium on a 32px line. Sidebar column 192px.
- Mobile header (56px, fixed): the sidebar toggle (lucide `PanelLeft`, 16px, 1.5 stroke, in a 44px button), then the same lockup on the mobile scale: 18px mark + Inter 14 medium on a 28px line, linking to the Introduction. Nothing on the right.
- Rows 32px tall (44px on touch), full-width hit area. Section names `subtle-foreground`; current section `foreground`.
- Question: 14/20, `subtle-foreground`, under the current section.
- Essays behind a 1px `border` guide line: Published `muted-foreground`, Soon `subtle-foreground` (plain text, not links), current essay `foreground` with a 2px × 14px `foreground` bar on the guide line.
- Footer: 1px `border` top, About link (`.link`) and a 32px mute button (lucide `Volume2` / `VolumeX`).
- Scrollbars are hidden site-wide. The list between wordmark and footer is the only part of the sidebar that scrolls, with a 2.5rem scroll fade on whichever edge still has content (craft.gustavofior.com/scroll-fades). Below md the list starts under the 56px header and carries the 64px rest offset as padding, so items can scroll up to the header and dissolve. Code blocks and tables in Notion bodies use the same fade horizontally.

**Headings**: top-level page titles (section pages, Introduction, About) use the sidebar wordmark's type, Inter 16 medium on a 32px line, so title and wordmark share baseline, cap height and center across the columns, as on devouringdetails.com/system (decided). Essay title Newsreader 32/38, tracking -0.015em, `text-wrap: balance`. Eyebrow (section name above an essay title) 14px `subtle-foreground`. Content and sidebar both start 128px from the top on desktop and 64px below the 56px header on mobile.

**Text**: intros, summaries and essay body in `muted-foreground` with `text-wrap: pretty`; bold in `foreground`. Inline code Geist Mono 14px (0.875em of the reading size) on `card` with 1px `border`, 6px radius. Content column max width 672px, blocks 56px apart (48px on mobile).

**Demo stage** (one component everywhere): `card` background, 1px `border`, 10px radius, demo centered. Large stage 2:1, card thumbnail 4:3. Caption 13/20 `subtle-foreground`, centered, 10px below.

**Essay card**: no border at rest. Hover (fine pointers only) fills `card` on an area extending 8px past the thumbnail with an 18px radius (10 + 8, concentric). Title 16 medium `foreground`, summary 14/22 `subtle-foreground`. Soon cards: empty stage, title and summary in `subtle-foreground`, no badge; no hover, press, sound or pointer cursor.

### 11.4 Sound

Library: `@web-kits/audio` (Web Audio synthesis, no audio files). All sounds are defined in **`src/lib/sounds.ts`**; elements opt in with `data-sound="<name>"`, and one client component at the root listens for activations and plays them. Server components need no client code to make a sound.

| Name | Definition | Used for |
|---|---|---|
| `tap` | a dry tick: pink noise through a bandpass at 2800 Hz (Q 1.4), decay 0.015 s, gain 0.32, over a sine at 180 Hz, decay 0.04 s, gain 0.06 | non-navigating presses: in-text links, About, mobile sidebar toggle |
| `page` | a sheet settling: pink noise through a lowpass that opens at 2200 Hz and closes to 700 Hz over 0.14 s (Q 0.7); envelope attack 0.012, decay 0.17; gain 0.12 | any press that navigates: cards, thumbnails, sidebar essays and sections |
| `toggle-on` | a switch click: pink noise through a bandpass at 2200 Hz (Q 1.6), decay 0.014 s, gain 0.3, over a triangle body at 420 Hz (lowpass at 3× the body), decay 0.055 s, gain 0.07 | unmute, open mobile sidebar |
| `toggle-off` | the same click, duller: transient at 1500 Hz, body at 300 Hz | mute (plays just before silence), close mobile sidebar |
| `hover` | the tap's tick alone, quieter and shorter: pink noise through a bandpass at 2400 Hz (Q 2), decay 0.01 s, gain 0.36 | entering a sidebar item (Introduction, sections, essays, Resources, About) with a mouse on a fine pointer; once per item, never on Soon items |

No sound is a melody or a pitch sweep: each is a short mechanical gesture, and on/off differ by weight and brightness, not by notes. Peaks sit near 0.08 for the clicks, 0.04 for `page` and 0.03 for `hover`.

Every play uses `jitter: { detune: 30, volume: 0.08 }`.

Rules:
- **On by default.** Sound answers user gestures only, so browser autoplay rules are never hit (the audio context resumes on the first gesture).
- **One sound per gesture**: a navigating link plays `page`, never `tap` + `page`. Keyboard activation (Enter/Space) plays the same sound as a click.
- **Hover** is silent everywhere except the sidebar, where items opt in with `data-sound-hover="hover"`. It plays once on entering an item (moving between its children never repeats it), only for `pointerType === "mouse"` on `(hover: hover) and (pointer: fine)`, so touch and pen stay silent.
- **Silent**: focus, scroll, page load, Soon items, hover outside the sidebar.
- Throttle: the same sound can't restart within 60 ms.
- **Mute** button in the sidebar footer: sets master volume to 0 via `setMasterVolume`, persisted in `localStorage`, `aria-pressed`, accessible name "Mute sound" (constant; `aria-pressed` carries the state).
- Reduced motion does not mute. Sound never carries information that is not also visible.
- Demos may define their own sounds and must respect the site mute.

### 11.5 Motion

Approach: CSS first (portfolio patterns) plus React `<ViewTransition>` for route changes. Motion (`motion/react`) is used only inside demos, never in site chrome. Animate only `transform`, `opacity`, `color` and `background-color` (exception: sidebar section expand uses the `grid-template-rows: 0fr → 1fr` technique).

| Moment | Motion | Timing | Sound |
|---|---|---|---|
| First page load | `page-enter`: blocks rise 6px, staggered | 500 ms, 60 ms stagger | none |
| Route change | crossfade of the main column (`<ViewTransition>`) | 200 ms | `page` |
| Card thumbnail → essay | shared-element morph into the essay's large stage (`<ViewTransition name="demo-<slug>">`) | 350 ms | `page` |
| Current essay changes | sidebar bar slides to the new essay (shared `<ViewTransition>` name) | 250 ms | part of `page` |
| Section switch in sidebar | new section's essays expand, old collapse | 200 ms | none |
| Press: cards, thumbnails, rows | `.press`, scale 0.98 | 160 ms | per §11.4 |
| Press: small buttons | scale 0.94 | 160 ms | per §11.4 |
| Link hover | `subtle` → `foreground`; arrows nudge | 150 ms | none |
| Card hover (fine pointer) | `card` fill appears | 150 ms | none |
| Mute toggle | icon crossfade: opacity, scale 0.25 → 1, blur 4px → 0 | 150 ms | `toggle-off` / `toggle-on` |
| Mobile sidebar push | content `translateX`, spring-like CSS `linear()` curve | ~400 ms | `toggle-on` / `toggle-off` |
| Live thumbnail mounts | `stream-in` fade | 200 ms | none |

All easing is `--ease-out` unless noted. With `prefers-reduced-motion`, everything above becomes instant except color changes, and view transitions are skipped.

Rejected (decoration, not explanation): hover sounds outside the sidebar, scroll-triggered reveals, parallax, cursor followers, logo animation, shimmering skeletons, hover effects on live demo thumbnails, animated focus rings.

### 11.6 Embeds (`/demos/<name>`)

- `?theme=system` (default) resolves to the light tokens on light hosts and the dark tokens on dark ones; `?theme=light|dark` forces one. This is the only place light mode exists.
- `?bg=transparent` and `?chrome=0` as in §6.2. The attribution mark is the shaving mark + "Sanding Space ↗", 12px `subtle-foreground`, bottom-right, `target="_blank"`.
- No site sounds and no page entrance inside embeds. A demo's own sounds play only on interaction inside the iframe.

### 11.7 Accessibility

Lighthouse 100 on essay and demo pages, plus:
- Every text token passes AA against its background (§11.2); Soon text uses `subtle-foreground`, never a dimmer value.
- Skip link; landmarks `<nav aria-label="Sections">` and `<main id="main-content">`; `aria-current="page"` on the current essay.
- Mobile sidebar toggle: `aria-expanded` + `aria-controls`; page content `inert` while open; Escape closes and focus returns to the toggle.
- Hit areas ≥ 32px on fine pointers, ≥ 44px on touch.
- Focus rings are instant, never animated.

### 11.8 Quality gates

The `better-interface`, `find-animation-opportunities` and `improve` skills review built code, so they run **after** each milestone, not before:

1. `better-interface` once the first screens exist (accessibility, layout, writing, type, color, polish) against this section.
2. `find-animation-opportunities` (read-only) on the built pages, checking §11.5 against reality.
3. `improve` at the end of the milestone, producing prioritized plans for the next one.

Findings feed the next implementation plan rather than being patched ad hoc.

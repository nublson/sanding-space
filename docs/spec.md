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
- Tailwind CSS + shadcn/ui tokens
- `notionic` + `@notionhq/client`
- Motion (`motion/react`) for demo animation (suggested)
- Deploy on Vercel
- Optional, for embed analytics: Vercel Analytics custom events or a small Supabase table (suggested)

### Environment variables

```
NOTION_TOKEN=                       # Notion integration token with access to the Sanding Space teamspace
NOTION_SECTIONS_DATA_SOURCE_ID=f38f8100-846a-4076-953e-296370a910d2
NOTION_ESSAYS_DATA_SOURCE_ID=92208a07-e0f7-4a67-94d6-a220d3529348
NEXT_PUBLIC_SITE_URL=https://sanding.space
```

The Notion integration must be connected to the **Library** page (or the whole teamspace) so it can read both databases and their pages.

---

## 3. Notion content model (already created)

Both databases live under a page called **Library** in the Sanding Space teamspace. Use **data source IDs** (Notion API 2025-09-03+) when querying.

| Database | Database ID | Data source ID |
|---|---|---|
| Sections | `2fd8c999c699433485fde2b2fdea1ac4` | `f38f8100-846a-4076-953e-296370a910d2` |
| Essays | `aa48ccb1566c4a75b6912f62717ac4e1` | `92208a07-e0f7-4a67-94d6-a220d3529348` |

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
| Status | status | `Draft` / `Soon` / `Published` |
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
- `Soon`: listed in the index and sidebar with a "Soon" treatment (muted / badge, not clickable), no essay page (404 or not generated).
- `Draft`: invisible on the site. Optionally viewable via Next.js draft mode for previewing.

A section is shown only if `Visible = true` **and** it has at least one `Published` or `Soon` essay (decided). Empty visible sections are hidden everywhere (index, sidebar, `/sections/<slug>` returns 404).

---

## 4. Routes and URLs

| What | URL | Notes |
|---|---|---|
| Index | `/` | All visible sections, in Order, each listing its essays (cards with live cover demo) |
| Essay | `/<slug>` | Flat URL (decided). Section shown in UI/breadcrumb only, so moving an essay between sections never breaks a link |
| Section | `/sections/<slug>` | Section intro + its essays |
| Demo | `/demos/<name>` | Standalone, chromeless, embeddable. **Permanent URL** |
| Demo OG image | `/demos/<name>/opengraph-image` | |
| oEmbed | `/api/oembed` | |
| Embed helper | `/embed.js` | Auto-height script |

### Reserved slugs (decided)

Essay slugs must not be any of: `demos`, `sections`, `api`, `about`, `rss`, `og`, `embed.js`, `sitemap.xml`, `robots.txt`, `opengraph-image`. Add any new top-level route to this list.

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
    essay: "button-press",        // canonical essay slug for the "Read the essay" link
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
- Respect `prefers-reduced-motion` and `prefers-color-scheme` unless overridden.
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
- Essay OG images use the cover demo screenshot plus the title.

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
7. Every registry `essay` value points to an existing, non-Draft essay slug (warn, don't fail, if it points to a `Soon` essay).

---

## 8. First milestone (scaffold)

Deliver, end to end:

1. Next.js app with Tailwind, shadcn/ui tokens, notionic styles imported after Tailwind (`@import "tailwindcss"; @import "notionic/styles.css";`), light and dark themes.
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

- Top: the wordmark (shaving mark + **Sanding Space**, §10), linking to `/`.
- Sections in `Order`, collapsed to their name. Collapsed sections link to `/sections/<slug>`.
- The **current section** is expanded: its name, its `Question` (small, muted) below it, then its essays (`Published` and `Soon`) behind a thin vertical guide line.
- The essay being read is marked with a short bar in the brand color on the guide line. `Soon` essays are muted and not clickable.
- Footer pinned to the bottom: **About** link and a light/dark theme toggle (defaults to system).
- Current section: on an essay page, the essay's section; on `/sections/<slug>`, that section; on the index, the section currently on screen (scroll-spy), with no essay marked.
- Desktop: always visible, sticky beside the content.

### 9.2 Index `/`

For each visible section, in `Order`, stacked and separated by a hairline:

1. Section **name** as the heading (no Question here; the sidebar shows it).
2. The **first paragraph** of the section's Notion page body (the intro), linking on to `/sections/<slug>` for the rest.
3. A **large live thumbnail** of the section's first `Published` essay (lowest `Order`), rendering that essay's `Cover demo`, with title and `Summary` below. `Soon` essays never take this slot.
4. The section's remaining essays as **cards in a 3-column grid**: small live thumbnail (`Cover demo`), title, `Summary`. `Soon` cards keep their place with an empty stage, muted text and a "Soon" badge.

Live thumbnails mount their demo only when scrolled into view.

### 9.3 Section page `/sections/<slug>`

The section name, its **full** intro (Notion page body, skipping the linked Essays database view), then the same large thumbnail + card grid as on the index. Index and section page share one component for the essay block.

### 9.4 Essay `/<slug>`

- Section name as a small eyebrow above the title.
- A large demo stage (the first demo in the body, or the `Cover demo`) with its caption centered below.
- Essay body below a hairline; inline demos use the same stage + caption frame (§6.9), without actions.

### 9.5 Mobile

- Header identical to the desktop wordmark, with a **sidebar toggle button before the logo**. The header stays fixed.
- The sidebar is the same component (sections, Question, essays, About + theme footer). It lives off-canvas on the left; the toggle **pushes** the content to the right (no overlay), leaving part of the page visible.
- While open: the visible content is inert and tapping it closes the sidebar; Escape closes it; focus moves into the sidebar; choosing a link closes it and navigates. The toggle exposes `aria-expanded`. With reduced motion, open/close without the slide.
- The essay hero demo runs edge to edge; the card grid drops to 2 columns.

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

Named after the near-black of wet-and-dry sandpaper. There is **no accent hue**: the brand color is the ink. Anything that would be "accent" (current-essay bar, links, focus ring) uses the foreground color; hierarchy comes from weight, size and the muted tone, not color.

| Token | Light | Dark | Contrast on bg |
|---|---|---|---|
| `--background` | `#FAFAF9` | `#121212` | |
| `--foreground` (brand, ink) | `#1A1A19` | `#F2F1EE` | 16.7:1 / 16.6:1 |
| `--muted-foreground` (Soon, Question, captions) | `#6B6A66` | `#9A9893` | 5.2:1 / 6.5:1 |

All text tokens pass WCAG AA. Map these onto the shadcn/ui token names in `globals.css`; surfaces, borders and the demo stage tones are decided with the rest of the visual style (suggested: derive them from the same warm-gray family). Demos may use color internally; the site chrome does not.

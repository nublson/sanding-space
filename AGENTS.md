<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Sanding Space

**Sanding Space** (`sanding.space`) is a library of short essays about design engineering and product engineering. Every essay contains live, interactive demos, and every demo can also be embedded anywhere on the web.

The full build brief is [docs/spec.md](docs/spec.md). Read it before working on a feature. Decisions marked **(decided)** there are final; **(suggested)** ones can change, but say so.

## Product in short

- **Essays** are written in Notion and rendered with [notionic](https://notionic.dev) (`fetchBlocks` from `notionic/fetch` + `<NotionRenderer />`).
- **Sections** group essays: Principles, Foundations, Interaction, Motion, Components, Systems, Product. Read them from Notion; never hardcode the list.
- **Demos** are React components in the repo (`components/demos/<name>.tsx`), registered in `lib/demos.ts`. In Notion they are `/embed` blocks whose URL ends in `/demos/<name>`; the query string becomes the demo's `params`.
- Every demo has a permanent, standalone, chromeless, embeddable URL: `sanding.space/demos/<name>`.

## Naming

- Full name **Sanding Space** in wordmark, titles and meta, e.g. `Button Press · Sanding Space`.
- Domain is always lowercase: `sanding.space`.

## Stack

Next.js (App Router, RSC), TypeScript, Tailwind CSS v4 + shadcn/ui tokens, `notionic` + `@notionhq/client`, Motion (`motion/react`) for demos, deployed on Vercel. Package manager: **pnpm**. Lint/format: **Biome** (`pnpm lint`, `pnpm format`). Source lives in `src/`.

## Routes

| URL | What |
|---|---|
| `/` | Redirects (307) to `/introduction` |
| `/introduction` | Introduction: default page, a standalone Notion page (`NOTION_INTRODUCTION_PAGE_ID`); sidebar label and path fixed in `src/lib/standalone.ts`, heading and title from the page |
| `/about` | About, the colophon: who makes the site, how it is built, what you may do with the demos. A standalone Notion page (`NOTION_ABOUT_PAGE_ID`), same mechanism as the Introduction |
| `/resources` | Resources: tools and references by category, from the Resources database (`NOTION_RESOURCES_DATA_SOURCE_ID`). Label and path fixed in `src/lib/content/resources.ts`, intro from the database description |
| `/<slug>` | Essay (flat URL; section only appears in the UI) |
| `/sections/<slug>` | Section intro + its essays |
| `/demos/<name>` | Standalone embeddable demo (permanent URL) |
| `/api/oembed` | oEmbed endpoint |
| `/embed.js` | Auto-height helper script |
| `/opengraph-image`, `/<slug>/opengraph-image` (essays, Introduction, About, Resources), `/sections/<slug>/opengraph-image`, `/demos/<name>/opengraph-image` | Generated Open Graph cards (`src/lib/og/image.tsx`) |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | Generated from the library and the demo registry |
| `/llms.txt`, `/api/markdown/<path>`, `/api/mcp`, `/api/a2a`, `/openapi.json`, `/auth.md`, `/.well-known/*` | Agent surfaces (`src/lib/agents/`): any page as Markdown on `Accept: text/markdown` (rewrite in `next.config.ts`), MCP and A2A servers, discovery manifests |

Reserved essay slugs: `demos`, `sections`, `api`, `about`, `resources`, `introduction`, `rss`, `og`, `embed.js`, `sitemap.xml`, `robots.txt`, `opengraph-image`, `favicon.ico`, `icon0.svg`, `icon1`, `icon2`, `apple-icon`, `manifest.webmanifest`, `llms.txt`, `auth.md`, `openapi.json`, `.well-known`. Add every new top-level route to this list (here and in the build checks).

## Interface layout

Structure is decided in [docs/spec.md §9](docs/spec.md); visual style is not decided yet.

- **Sidebar** (same component on every size): wordmark (links to `/introduction`), the fixed **Introduction** item, then sections collapsed except the current one (which shows its Question and its essays, current essay marked with a bar), Resources and About (Resources above) + mute button in the footer. The current item comes from the URL.
- **Introduction** (`/introduction`, the default page): laid out like a section page, the Notion page’s title as the heading and its body below. **Section page**: full intro, its first essay by Order as a large card (Soon included: empty stage, muted text, not a link), the rest in a 3-column card grid. There is no Soon badge; the title carries a screen-reader-only "(coming soon)".
- **Essay**: section eyebrow, title, large demo stage with caption, then the body.
- **Resources** (`/resources`): heading, the one-line intro, then each category (in the order of the Category property's options) as a heading over one row per resource: favicon, name, description, the row linking out in a new tab. Resources sort by Order within their category. The per-essay References block is out of the first milestone.
- **Mobile**: same header with a sidebar toggle before the logo; the sidebar pushes the content right (no overlay).
- Demo frame is **stage + caption only**; Replay / Copy link / Embed / Open are deferred.

## Brand

Decided in [docs/spec.md §10](docs/spec.md): the **shaving** mark (one curl stroke, `currentColor`, static) and a **monochrome** palette called silicon carbide. There is no accent hue: links, the current-essay bar and focus rings use the foreground ink. Demos may use color; the site chrome does not.

## Visual style and feedback

Decided in [docs/spec.md §11](docs/spec.md). The visual system is the author's portfolio (nublson.com, repo `nublson/nublson`): Inter / Newsreader / Geist Mono, achromatic OKLCH dark tokens, `--ease-out` motion utilities.

- **UI kit**: shadcn/ui on **Base UI** primitives (`base-nova`), lucide icons. Don't add Radix.
- **Sound**: `@web-kits/audio`. Five sounds (`tap`, `page`, `toggle-on`, `toggle-off`, `hover`) defined only in `src/lib/sounds.ts`; elements opt in with `data-sound` (press) and `data-sound-hover` (sidebar items only, mouse on fine pointers). Press, state changes and sidebar hover only, never focus/scroll/load. One sound per gesture.
- **Motion**: CSS first + React `<ViewTransition>` for routes. `motion/react` is for demos only, never site chrome. Animate transform/opacity/color only; honor reduced motion.
- **Quality gates** after each milestone: `better-interface`, then `find-animation-opportunities`, then `improve` (§11.8).

## Rules that are easy to break

- **Essay status**: `Published` → live page. `Soon` → listed, muted, not clickable, no page. `Preview` → Published everywhere except Vercel production, where it is Draft (resolved once in `getLibrary` via `showPreviews()`). `Draft` → invisible (draft mode only). Sections show only when `Visible = true` and they have at least one Published or Soon essay.
- **Resource visibility**: a Resources row shows only with `Visible = true`, a name, a URL and a Category that is one of the options. A database without a Visible column shows every row. Categories show only when they have at least one such row.
- **Demo names are permanent.** Renaming = add the old name to `aliases` (308 redirect, keep the query string). Demos are never deleted; retired ones render a "This demo has moved" card.
- **Frame params** `theme`, `bg`, `chrome` are consumed by the demo route and never passed to the demo. Demos must not use those param names. `chrome` has no effect any more (embeds have no attribution mark) but stays reserved for old URLs.
- **Demo param presets** mean the same thing in every demo (`src/components/demos/controls`): `guides` is the Guides chip (`useGuides`), and what turning it on shows is up to each demo; controls are hidden by default, so `?pressure=on` locks that state; `controls=on` shows the controls for the params present (`showsControls`). Demos may use a preset name only with that meaning.
- **Headers**: `/demos/:path*` gets `frame-ancestors *` (no `X-Frame-Options`); everything else gets `frame-ancestors 'self'`.
- Pages without demos must ship no demo JavaScript; a demo page ships only its own demo.
- The linked Essays database view at the end of a section page body must render nothing.
- Unknown demo names and unknown linked pages degrade gracefully (link / plain text), never break the page.
- Accessibility target is Lighthouse 100 on essay and demo pages; respect `prefers-reduced-motion`. The site is dark only; light tokens exist only for demo embeds (`?theme`).

## Environment

```
NOTION_TOKEN=
NOTION_SECTIONS_DATA_SOURCE_ID=f38f8100-846a-4076-953e-296370a910d2
NOTION_ESSAYS_DATA_SOURCE_ID=92208a07-e0f7-4a67-94d6-a220d3529348
NOTION_RESOURCES_DATA_SOURCE_ID=3756f20a-f849-489e-8571-51858d7b8cbc
NOTION_INTRODUCTION_PAGE_ID=405b1726-8ab3-81f0-9d46-ef735904da9e
NOTION_ABOUT_PAGE_ID=
NEXT_PUBLIC_SITE_URL=https://sanding.space
```

Query Notion by **data source ID** (API 2025-09-03+).

## Git

`develop` is the base branch for work; `main` is production. Branch off `develop` and open PRs into it. Vercel builds previews for `develop` and for branches with an open PR (after GitHub checks pass) and production for `main` after the release gate; other branches are skipped by `scripts/vercel-wait-github-ci.mjs` (see README, Deployment).

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->

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
| `/` | Index: visible sections in order, each with its essays |
| `/<slug>` | Essay (flat URL; section only appears in the UI) |
| `/sections/<slug>` | Section intro + its essays |
| `/demos/<name>` | Standalone embeddable demo (permanent URL) |
| `/api/oembed` | oEmbed endpoint |
| `/embed.js` | Auto-height helper script |

Reserved essay slugs: `demos`, `sections`, `api`, `about`, `rss`, `og`, `embed.js`, `sitemap.xml`, `robots.txt`, `opengraph-image`. Add every new top-level route to this list (here and in the build checks).

## Rules that are easy to break

- **Essay status**: `Published` → live page. `Soon` → listed, muted, not clickable, no page. `Draft` → invisible (draft mode only). Sections show only when `Visible = true`.
- **Demo names are permanent.** Renaming = add the old name to `aliases` (308 redirect, keep the query string). Demos are never deleted; retired ones render a "This demo has moved" card.
- **Frame params** `theme`, `bg`, `chrome` are consumed by the demo route and never passed to the demo. Demos must not use those param names.
- **Headers**: `/demos/:path*` gets `frame-ancestors *` (no `X-Frame-Options`); everything else gets `frame-ancestors 'self'`.
- Pages without demos must ship no demo JavaScript; a demo page ships only its own demo.
- The linked Essays database view at the end of a section page body must render nothing.
- Unknown demo names and unknown linked pages degrade gracefully (link / plain text), never break the page.
- Accessibility target is Lighthouse 100 on essay and demo pages; respect `prefers-reduced-motion` and `prefers-color-scheme`.

## Environment

```
NOTION_TOKEN=
NOTION_SECTIONS_DATA_SOURCE_ID=f38f8100-846a-4076-953e-296370a910d2
NOTION_ESSAYS_DATA_SOURCE_ID=92208a07-e0f7-4a67-94d6-a220d3529348
NEXT_PUBLIC_SITE_URL=https://sanding.space
```

Query Notion by **data source ID** (API 2025-09-03+).

## Git

`develop` is the base branch for work; `main` is production. Branch off `develop` and open PRs into it.

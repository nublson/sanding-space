# Sanding Space

**Sanding Space** (`sanding.space`) is a library of short essays about design engineering and product engineering. Every essay contains live, interactive demos, and every demo can be embedded anywhere on the web.

Essays are written in Notion and rendered with [notionic](https://notionic.dev). Demos are React components in this repo. The full build brief is in [docs/spec.md](docs/spec.md).

Pages: the Introduction (`/introduction`, where `/` redirects), essays (`/<slug>`), sections (`/sections/<slug>`), a static About page (`/about`), and standalone demos (`/demos/<name>`).

Stack: Next.js (App Router), TypeScript, Tailwind CSS v4 + shadcn/ui tokens, notionic, Motion, pnpm, Biome.

## Setup

```bash
pnpm i
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Purpose |
|---|---|
| `NOTION_TOKEN` | Notion integration secret |
| `NOTION_SECTIONS_DATA_SOURCE_ID` | Sections data source (query by data source ID) |
| `NOTION_ESSAYS_DATA_SOURCE_ID` | Essays data source |
| `NOTION_INTRODUCTION_PAGE_ID` | The standalone Notion page behind `/introduction` |
| `NOTION_ABOUT_PAGE_ID` | The standalone Notion page behind `/about` (the colophon) |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, `https://sanding.space` in production |
| `REVALIDATE_SECRET` | Bearer secret for `POST /api/revalidate` |

In Notion, create an internal integration and connect it to the Library page, so it can read the Sections and Essays databases.

```bash
pnpm dev
```

## Scripts

| Script | What |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build. `prebuild` runs `pnpm check:content` first |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Biome check |
| `pnpm format` | Biome format (writes) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest |
| `pnpm check:content` | Content build checks against Notion (needs `NOTION_TOKEN`) |

## Adding a demo

1. Create the component at `src/components/demos/<name>.tsx`. It receives its query-string values as `params`.
2. Add its metadata to `src/lib/demo-meta.ts` (`title`, `height`, and optional `essay` slug, `aliases`, `retired`). Without an `essay`, the attribution links to the home page.
3. Add a loader under the same name in `src/components/demos/lazy-demo.tsx`: `"<name>": dynamic(() => import("./<name>"))`. Each demo is its own chunk, loaded only where it renders.
4. In Notion, add an `/embed` block whose URL ends in `/demos/<name>`. The query string becomes `params`.

Rules:

- Demo names are permanent. To rename, add the old name to `aliases` (it becomes a 308 redirect that keeps the query string). Never delete a demo; set `retired: true` and it renders a "This demo has moved" card.
- The params `theme`, `bg` and `chrome` belong to the demo frame and are never passed to the demo, on `/demos/<name>` or inline in an essay. Do not use them as demo params.
- Thumbnails on the index and section pages sit inside links, so they render as live but non-interactive previews (`inert`). The essay page and `/demos/<name>` stay interactive.

## Embedding a demo

Every demo has a permanent standalone URL: `https://sanding.space/demos/<name>`.

```html
<iframe src="https://sanding.space/demos/<name>"
  data-sanding loading="lazy" style="width:100%;height:320px;border:0"
  title="Button press, scale · Sanding Space"></iframe>
<script async src="https://sanding.space/embed.js"></script>
```

`embed.js` resizes iframes marked `data-sanding` to the demo's height. The demo never reports less than its registry `height`, and taller content grows the iframe. Without the script, the inline height is used. `embed.js` only accepts messages from `https://sanding.space` (plus the page's own origin when it runs on `localhost`), so auto-height doesn't work for iframes pointing at preview deployments.

## Deployment

Vercel builds only when it makes sense. `vercel.json` runs `scripts/vercel-wait-github-ci.mjs` as the ignored-build step:

- A branch with an open pull request builds a preview once every GitHub Actions check on the deployed commit has passed; a failed check cancels the deployment.
- `develop` builds a preview straight away.
- `main` builds production only after the Release workflow posts the `release/build-validation` commit status.
- Any other branch without a pull request is skipped.

The script needs `GITHUB_WAIT_TOKEN` in the Vercel project (Preview and Production): a fine-grained GitHub token with Contents, Checks and Commit statuses read access on this repository. Without the token the script lets every build through and says so in the build log; with a token, any error reading GitHub cancels the deployment, so a misconfigured token shows up as canceled previews rather than ungated builds.

Frame params:

| Param | Values | Default |
|---|---|---|
| `theme` | `light` / `dark` / `system` | `system` |
| `bg` | `default` / `transparent` | `default` |
| `chrome` | `0` hides the "Sanding Space ↗" mark | shown |

The demo page is prerendered without the query string, so the mark only appears once the params are read (it never flashes in with `?chrome=0`). With a forced `theme`, the first paint may briefly use the system theme.

oEmbed:

```
GET https://sanding.space/api/oembed?url=https://sanding.space/demos/<name>&maxwidth=&maxheight=&format=json
```

- Demo URLs (`/demos/<name>`, aliases included) return `type: "rich"` JSON with the iframe `html`. They come from the in-repo registry and work without Notion.
- Essay URLs (`/<slug>`) need Notion. A Published essay with a cover demo returns that demo as `rich`, one without returns `type: "link"`. If Notion is unavailable, the endpoint answers `503`.
- Other origins, unknown paths and Soon essays return `404`. Only `format=json` is supported (`501` otherwise).

## Revalidation

Content is cached under the `notion` tag. After editing in Notion, refresh it:

```bash
curl -X POST https://sanding.space/api/revalidate \
  -H "Authorization: Bearer $REVALIDATE_SECRET"
```

## Git

Branch off `develop` and open PRs into it. `main` is production.

# Sanding Space

**Sanding Space** (`sanding.space`) is a library of short essays about design engineering and product engineering. Every essay contains live, interactive demos, and every demo can be embedded anywhere on the web.

Essays are written in Notion and rendered with [notionic](https://notionic.dev). Demos are React components in this repo. The full build brief is in [docs/spec.md](docs/spec.md).

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
2. Add its metadata to `src/lib/demo-meta.ts` (`title`, `essay` slug, `height`, optional `aliases`, `retired`).
3. Add the component to the `components` map in `src/lib/demos.tsx` under the same name.
4. In Notion, add an `/embed` block whose URL ends in `/demos/<name>`. The query string becomes `params`.

Rules:

- Demo names are permanent. To rename, add the old name to `aliases` (it becomes a 308 redirect that keeps the query string). Never delete a demo; set `retired: true` and it renders a "This demo has moved" card.
- The params `theme`, `bg` and `chrome` belong to the demo frame and are never passed to the demo. Do not use them as demo params.

## Embedding a demo

Every demo has a permanent standalone URL: `https://sanding.space/demos/<name>`.

```html
<iframe src="https://sanding.space/demos/button-press-scale"
  data-sanding loading="lazy" style="width:100%;height:320px;border:0"
  title="Button press, scale · Sanding Space"></iframe>
<script async src="https://sanding.space/embed.js"></script>
```

`embed.js` resizes iframes marked `data-sanding` to the demo's height. Without it, the inline height is used.

Frame params: `?theme=`, `?bg=`, `?chrome=0` (hides the attribution).

oEmbed:

```
GET https://sanding.space/api/oembed?url=https://sanding.space/demos/button-press-scale&maxwidth=&maxheight=&format=json
```

Returns `type: "rich"` JSON with the iframe `html`, so Notion and other oEmbed consumers can embed a demo from its URL.

## Revalidation

Content is cached under the `notion` tag. After editing in Notion, refresh it:

```bash
curl -X POST https://sanding.space/api/revalidate \
  -H "Authorization: Bearer $REVALIDATE_SECRET"
```

## Git

Branch off `develop` and open PRs into it. `main` is production.

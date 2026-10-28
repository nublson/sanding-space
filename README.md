# Sanding Space

**Sanding Space** (`sanding.space`) is a library of short essays about design engineering and product engineering. Every essay contains live, interactive demos, and every demo can be embedded anywhere on the web.

Essays are written in Notion and rendered with [notionic](https://notionic.dev). Demos are React components in this repo. The full build brief is in [docs/spec.md](docs/spec.md).

Pages: the Introduction (`/introduction`, where `/` redirects), essays (`/<slug>`), sections (`/sections/<slug>`), a static About page (`/about`), a Resources page (`/resources`), and standalone demos (`/demos/<name>`).

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
| `NOTION_RESOURCES_DATA_SOURCE_ID` | Resources data source (the `/resources` page) |
| `NOTION_INTRODUCTION_PAGE_ID` | The standalone Notion page behind `/introduction` |
| `NOTION_ABOUT_PAGE_ID` | The standalone Notion page behind `/about` (the colophon) |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, `https://sanding.space` in production |
| `REVALIDATE_SECRET` | Bearer secret for `POST /api/revalidate` |
| `NOTION_WEBHOOK_SECRET` | The `verification_token` Notion sends when the webhook is registered; signs every event to `POST /api/notion-webhook` |

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
| `chrome` | Reserved, no effect (the frame no longer draws an attribution mark) | — |

The demo page is prerendered without the query string, so with a forced `theme` the first paint may briefly use the system theme.

oEmbed:

```
GET https://sanding.space/api/oembed?url=https://sanding.space/demos/<name>&maxwidth=&maxheight=&format=json
```

- Demo URLs (`/demos/<name>`, aliases included) return `type: "rich"` JSON with the iframe `html`. They come from the in-repo registry and work without Notion.
- Essay URLs (`/<slug>`) need Notion. A Published essay with a cover demo returns that demo as `rich`, one without returns `type: "link"`. If Notion is unavailable, the endpoint answers `503`.
- Other origins, unknown paths and Soon essays return `404`. Only `format=json` is supported (`501` otherwise).

## Revalidation

Content is cached under the `notion` tag for a few minutes. A Notion webhook refreshes it as soon as the library changes; the manual endpoint remains as a fallback.

### Notion webhook

`POST /api/notion-webhook` receives Notion's events. It answers the one-time verification handshake, checks the `X-Notion-Signature` header (HMAC-SHA256 of the raw body, keyed by the verification token) on every later event, and revalidates the `notion` tag for page, data source and database events. Comment events are acknowledged and ignored. A missing secret answers `503`, a bad signature `401`, an unrecognised body `400`.

To register it:

1. Deploy the route first, with `NOTION_WEBHOOK_SECRET` still unset.
2. In [Notion integrations](https://www.notion.so/profile/integrations), open the site's integration, go to the **Webhooks** tab and create a subscription with the URL `https://sanding.space/api/notion-webhook`. Subscribe at least to `page.content_updated`, `page.properties_updated`, `page.created`, `page.deleted`, `page.moved`, `page.undeleted`, `data_source.content_updated` and `data_source.schema_updated`.
3. Notion POSTs a `verification_token` once. The route logs it in the production function logs on Vercel as `[notion-webhook] verification token received: …`. If it did not arrive, use **Resend token** in Notion.
4. Paste the token into Notion (**Verify** at the bottom of the Webhooks tab) and set `NOTION_WEBHOOK_SECRET` to the same value in the Vercel project, then redeploy. Until the variable is set, events are rejected with `503` and Notion retries them with backoff for about a day.
5. Edit a page in the library and check the function logs for a `200`. `page.content_updated` events are batched, so they can land a minute or so after the edit; `page.locked` is immediate and handy for a quick test.

The webhook only subscribes to pages the integration can see, so new pages still need the integration connected to the Library page.

### Manual refresh

```bash
curl -X POST https://sanding.space/api/revalidate \
  -H "Authorization: Bearer $REVALIDATE_SECRET"
```

## Git

Branch off `develop` and open PRs into it. `main` is production.

### notionic updates

New notionic releases arrive as pull requests. The notionic Update workflow (`.github/workflows/notionic-update.yml`) runs daily at 06:23 UTC, and on demand from the Actions tab. When npm has a newer notionic than the `develop` lockfile, it runs `pnpm add notionic@<latest>` on the `deps/notionic` branch and opens a PR into `develop`, or updates the one already open. A release that `develop` already has closes the stale PR.

A PR opened with `GITHUB_TOKEN` doesn't start `pull_request` workflows, so the workflow dispatches PR Checks on the branch itself. Review the release notes linked in the PR, then merge it like any other once the checks pass.

`pnpm-workspace.yaml` excludes notionic from pnpm's minimum release age, so a release from the same day installs. Other dependencies still wait a day.

The workflow needs **Allow GitHub Actions to create and approve pull requests** turned on in Settings → Actions → General → Workflow permissions.

# Essay share and Apply briefs

Date: 2026-11-04. Status: approved design, awaiting spec review.

## Goal

A reader should be able to hand an essay to their AI agent and have the agent apply what the essay teaches to the reader's own code. The essay header gets three actions: **Copy as Markdown**, **Copy link** and **Share**. Behind them, each essay can carry a distilled **Apply brief**: the essay's lessons rewritten as rules an agent can act on, with the essay itself as the reasoning.

## Decisions

- **Apply brief is a Notion property, written per essay.** A rich-text `Apply` property on the Essays database. It never renders on the website.
- **One canonical Markdown.** The brief is part of the essay's Markdown, not a separate surface, so every agent path carries it: Copy as Markdown, `/api/markdown/<slug>`, `Accept: text/markdown` on the essay URL, and MCP/A2A `get_page`. A pasted plain URL is enough for an agent that fetches Markdown.
- **No brief, no section.** An essay without an `Apply` value keeps today's Markdown byte for byte. No generic fallback brief.
- **Share is a menu** of "Open in…" handoffs plus today's story image and the native share sheet. Copy as Markdown and Copy link stay one-click buttons.
- **Icon-only buttons**, named for screen readers, no visible labels or tooltips.

## Content: the `Apply` property

- Type: rich text, on the Essays data source (`NOTION_ESSAYS_DATA_SOURCE_ID`). Optional.
- Authoring convention: Markdown-ish plain text. A property cell has only inline formatting, so lists are lines starting with `- `, code is in backticks, and blank lines separate groups. The text is passed through as written; Notion's inline bold, code and link annotations are ignored (plain text only), so the convention is the whole format.
- Notion splits long rich text into chunks of up to 2,000 characters; the parser joins every chunk, so there is no practical length cap. If the page object truncates the property (Notion returns at most 100 rich-text items inline), the parser reads it in full through the page-property endpoint.
- Suggested shape, not enforced:

  ```
  Use when: buttons, links, any pressable control.
  - Pressed state responds within one frame: use :active, not a JS handler.
  - Scale to 0.97, never below 0.95.
  Look for: onClick handlers that set a "pressed" state; transitions on `all`.
  ```

- Parsed in `src/lib/content/parse.ts` into `essay.apply: string | null` (trimmed; empty → `null`), added to the `Essay` type.

## Markdown output

`essayMarkdown()` in `src/lib/agents/markdown.ts` gains two sections when `essay.apply` is set. Order:

1. Front matter (unchanged)
2. `# <title>` and `> <summary>` (unchanged)
3. `## Apply this to your code`, then a fixed intro paragraph, then the `Apply` text as written
4. `## Essay`, then the `Demo:` line and the body (unchanged content)

The fixed intro, defined once in code:

> You are an AI coding agent. The user shared this essay so you apply it to their codebase. Find the places it covers, propose focused changes, and leave unrelated code alone. The essay below is the reasoning behind each rule.

When `essay.apply` is `null`, neither heading is added and the output is identical to today's.

Discovery: `/llms.txt` gains one line, and the `get_page` tool description in `src/lib/agents/tools.ts` gains one sentence, saying essays may start with an "Apply this to your code" brief for agents.

## Interface: the essay header

The single share icon at the right of the eyebrow row (`src/app/(site)/[slug]/page.tsx`) becomes a row of three icon buttons, using the existing `Button`, `text-subtle-foreground`, and 44px targets on coarse pointers. The rightmost icon, not its hit area, keeps lining up with the column edge.

| Button | Icon (lucide) | Action |
|---|---|---|
| Copy as Markdown | `FileText` | Copies `/api/markdown/<slug>` |
| Copy link | `Link` | Copies the canonical essay URL |
| Share | `Share` | Opens the share menu |

**Copy feedback** (both copy buttons): on success the icon becomes `Check` and the accessible name "Copied" for about 1.5 s, announced through a polite live region; on failure the `RotateCw` retry icon and "Couldn't copy", as `ShareStory` does today. Sound: `tap` on press, nothing else (one sound per gesture).

**Copy as Markdown** prefetches the Markdown on pointer enter, touch start and focus. It writes with `navigator.clipboard.write([new ClipboardItem({ "text/plain": promise })])` so Safari keeps the user-gesture permission while the fetch is still pending; where `ClipboardItem` with a promise is unsupported it awaits the fetch and uses `writeText`. A failed fetch resets, so the next press fetches again.

**Copy link** uses `navigator.clipboard.writeText`, falling back to a hidden input plus `document.execCommand("copy")`.

**Share menu** items, in order:

1. **Open in Claude**: `https://claude.ai/new?q=<prompt>`
2. **Open in ChatGPT**: `https://chatgpt.com/?q=<prompt>`
3. **Open in Cursor**: Cursor's prompt deep link with `<prompt>`. Verify its current URL format before building; drop the item if Cursor has no stable web-openable form.
4. Separator
5. **Share story image**: today's `ShareStory` behavior (files only, so Instagram stays in the iOS sheet; download where files can't be shared; prefetch on menu open)
6. **Share link…**: `navigator.share({ title, url })`; rendered only where `navigator.share` exists

"Open in…" items are links that open in a new tab (`target="_blank" rel="noopener"`). The prompt, URL-encoded:

- With a brief: `Read <essay URL> and apply its "Apply this to your code" brief to my project.`
- Without: `Read <essay URL> and apply what it teaches to my project.`

The popup is anchored to the trigger, aligned to the end edge, and collision-avoids the viewport on narrow phones. Motion: CSS opacity plus a small scale from the trigger origin, none under `prefers-reduced-motion`.

## Components

- `src/components/ui/menu.tsx` (new): our Menu on Base UI's `Menu`, with only Trigger, Popup (portal + positioner), Item, LinkItem and Separator, styled with the shared tokens. It is the first menu in the library; demos may use it later.
- `src/components/share/essay-share.tsx` (new, client): the three buttons and the menu. Props: `slug`, `title`, `url`, `hasApply`.
- `src/components/share/use-story-image.ts` (from `share-story.tsx`): the fetch/share/download logic and its state, used by the "Share story image" menu item. `ShareStory` as a standalone button is removed.
- Shipped only on essay pages; no demo JavaScript added to any page.

## Edge cases

| Case | Behavior |
|---|---|
| Clipboard blocked or missing | Retry state and "Couldn't copy"; Copy link tries the `execCommand` fallback first |
| Markdown fetch fails | Retry state; next press refetches |
| Story image fails | Item shows the retry state as today; menu stays usable |
| No `navigator.share` | "Share link…" not rendered; story image downloads |
| Soon essays | No page, so no buttons |
| Preview essays | Same as Published wherever they render |
| Draft mode | Unchanged; the Markdown endpoint already follows draft mode |

## Testing

Vitest, alongside the existing tests:

- `parse.test.ts`: reads `Apply`; joins multi-chunk rich text; empty and missing → `null`.
- `markdown.test.ts`: with a brief, the sections appear between the summary and the body in the order above; without one, output equals today's snapshot.
- `essay-share.test.tsx`: Copy link writes the URL; Copy as Markdown writes the fetched body; Copied and retry states and their announcements; "Open in…" hrefs carry the encoded prompt for both brief and no-brief essays; "Share link…" hidden without `navigator.share`.
- `share-story.test.tsx` moved and updated for the hook and menu item.
- Manual: Safari iOS copy from a cold tap, keyboard-only menu (open, arrow, Enter, Escape returns focus to the trigger), Lighthouse accessibility 100 on an essay page.

## Docs and Notion

- `docs/spec.md`: the `Apply` property in the content model; the essay header's share row in §9.
- `AGENTS.md`: the Essay line under Interface layout mentions the share row; agent surfaces note the Apply brief.
- Notion: add the `Apply` rich-text property to the Essays database. Ask the owner before changing the schema.

## Out of scope

- Apply briefs for sections, Introduction, About or Resources.
- A Claude Code slash command, skill or plugin that wraps the brief.
- Analytics on share actions.

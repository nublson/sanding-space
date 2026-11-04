# Essay Share and Apply Briefs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Each essay can carry an agent-facing Apply brief (a Notion property) that leads its Markdown, and the essay header gets Copy as Markdown, Copy link and a Share menu that hands the essay to Claude, ChatGPT or Cursor.

**Architecture:** `parseEssay` reads the `Apply` rich-text property into `essay.apply`; `essayMarkdown` (the one Markdown every agent surface uses) inserts it under a fixed intro. On the page, a new client `EssayShare` replaces `ShareStory`: two copy buttons on a small clipboard helper, and a Share menu on a new Base UI `Menu` primitive whose items are "Open in…" links built from one prompt helper plus the story-image share (extracted into a hook).

**Tech Stack:** Next.js App Router (RSC), TypeScript, Tailwind v4, `@base-ui/react` 1.9 (`menu`), lucide-react, Vitest + Testing Library, Biome, pnpm.

**Spec:** `docs/superpowers/specs/2026-11-04-essay-share-design.md`

## Global Constraints

- Branch `feat/essay-share-apply` (off `develop`); PR into `develop`.
- Notion property name: `Apply` (rich text, optional) on the Essays data source.
- Markdown headings, verbatim: `## Apply this to your code` and `## Essay`.
- Fixed intro, verbatim: `You are an AI coding agent. The user shared this essay so you apply it to their codebase. Find the places it covers, propose focused changes, and leave unrelated code alone. The essay below is the reasoning behind each rule.`
- Essay without `Apply`: Markdown byte-identical to today's.
- Prompts, verbatim: with brief `Read <url> and apply its "Apply this to your code" brief to my project.`; without `Read <url> and apply what it teaches to my project.`
- Handoff URLs: `https://claude.ai/new?q=`, `https://chatgpt.com/?q=`, `https://cursor.com/link/prompt?text=` (Cursor's documented web deeplink; prompt is prefilled, never auto-run), each followed by `encodeURIComponent(prompt)`.
- UI kit: only `src/components/ui/` components built on Base UI; lucide icons; no Radix, no shadcn components. `motion/react` is not used (site chrome).
- Sound: `data-sound="tap"` on each press, one sound per gesture, nothing on hover/focus.
- Motion: CSS only, transform/opacity, none under `prefers-reduced-motion`.
- Icon-only buttons with `aria-label`; copied/failed states announced through a polite `<output>` live region.
- Copy feedback lasts 1500 ms.
- Story image share keeps files-only `navigator.share` (no url/text).
- `pnpm lint`, `pnpm typecheck` and `pnpm test` pass at every commit.

## Review Focus

1. **An Apply brief that uses `#` or `##` headings** — the page title must stay the only `#` and the brief must not open sections that compete with `## Essay`; heading lines in the brief are demoted to `###`. Test in Task 2.
2. **A whitespace-only or line-break-only `Apply` cell** — treated as no brief (no empty section, no "brief" prompt). Tests in Tasks 1 and 5.
3. **Prompt characters that break query strings** (`&`, `#`, `"`, spaces in the URL or prompt) — the prompt decodes back exactly from every handoff href; Cursor is known to drop text after a raw `&`. Test in Task 5.
4. **Pressing Copy as Markdown repeatedly or before the prefetch resolves** — one fetch per page view while it succeeds, a fresh fetch after a failure, never a stale "Copied" on failure. Test in Task 4.
5. **Safari refusing the story share as a late gesture from inside the menu** — the menu stays open with the item renamed "Story image ready. Share it" so the next tap works; it closes on success or cancel. Test in Task 5.

---

### Task 1: Read the `Apply` property

**Files:**
- Modify: `src/lib/content/types.ts` (the `Essay` type)
- Modify: `src/lib/content/parse.ts` (`parseEssay`)
- Modify: `src/lib/content/__fixtures__/essay-page.json` (add an `Apply` property)
- Test: `src/lib/content/parse.test.ts`
- Modify (type fallout): every `Essay` literal in tests — `src/app/sitemap.test.ts`, `src/components/sidebar/sidebar.test.tsx`, `src/components/sidebar/current-sidebar.test.tsx`, `src/components/library/essay-card.preview.test.tsx`, `src/components/library/essay-card.test.tsx`, `src/components/library/section-block.test.tsx`, `src/lib/check-content.test.ts`, `src/lib/oembed.test.ts`, `src/lib/agents/markdown.test.ts`, `src/lib/agents/content.test.ts`, `src/lib/content/links.test.ts`, `src/lib/content/library.test.ts`

**Interfaces:**
- Produces: `Essay.apply: string | null` — the `Apply` cell's plain text, all rich-text chunks joined, trimmed; `null` when missing or blank.

- [ ] **Step 1: Write the failing tests.** In the fixture add `"Apply"` shaped like `Summary`, with two rich-text items whose `plain_text` are `"- Scale to 0.97.\n"` and `"- Never below 0.95."` (Notion splits long text into chunks). In `parse.test.ts`: add `apply: "- Scale to 0.97.\n- Never below 0.95."` to the expected object of "parses an essay page"; in "handles missing section…" also set `page.properties.Apply.rich_text = []` and assert `parsed.apply` is `null`; add `it("treats a blank Apply as no brief")` setting the single item's `plain_text` to `" \n "` and asserting `null`; add `it("reads an essay without an Apply column")` deleting `page.properties.Apply` and asserting `null`.
- [ ] **Step 2: Run** `pnpm vitest run src/lib/content/parse.test.ts` — expected FAIL (`apply` missing).
- [ ] **Step 3: Implement.** Add `apply: string | null;` to `Essay` after `coverDemo`; in `parseEssay` add `apply: text(p, "Apply") || null` (the existing `text` helper joins and trims).
- [ ] **Step 4: Run** the parse tests — expected PASS.
- [ ] **Step 5: Fix type fallout.** Run `pnpm typecheck`; add `apply: null` to each `Essay` literal/factory it reports (the files listed above). Run `pnpm typecheck && pnpm test` — expected PASS.
- [ ] **Step 6: Commit** — `feat: read the Apply brief from Notion`.

### Task 2: The Apply brief in the essay Markdown and discovery

**Files:**
- Modify: `src/lib/agents/markdown.ts` (`essayMarkdown`, `llmsTxt`)
- Modify: `src/lib/agents/tools.ts` (`get_page` description)
- Test: `src/lib/agents/markdown.test.ts`

**Interfaces:**
- Consumes: `Essay.apply` (Task 1).
- Produces: `export const APPLY_HEADING = "Apply this to your code"` and `export const APPLY_INTRO` (the verbatim intro) from `markdown.ts`, for Task 5's tests and any later surface.

- [ ] **Step 1: Write the failing tests** in the `essayMarkdown` describe:
  - `it("leaves an essay without a brief unchanged")`: with `essay({ apply: null })`, assert the output equals the exact string the current implementation produces for the same input (build the expected string inline from front matter, `# Button Press`, `> Why buttons sink.`, `Demo: …/demos/surface`, `Hello.`), and that it contains neither `## Apply this` nor `## Essay`.
  - `it("leads with the Apply brief, then the essay")`: with `apply: "- Scale to 0.97."`, assert the indices satisfy `> Why buttons sink.` < `## Apply this to your code` < `APPLY_INTRO` < `- Scale to 0.97.` < `## Essay` < `Demo: ` < `Hello.`, and `md.match(/^# /gm)` has length 1.
  - `it("demotes headings inside the brief")`: with `apply: "# Rules\n## Look for\n### Fine"`, assert the output contains `### Rules` and `### Look for` and `### Fine`, has exactly one `^# ` line and exactly one `^## Essay$` line, and no other `^## ` line except `## Apply this to your code`.
  - In the existing llmsTxt test, assert the output contains `Apply this to your code`.
- [ ] **Step 2: Run** `pnpm vitest run src/lib/agents/markdown.test.ts` — expected FAIL.
- [ ] **Step 3: Implement.** In `essayMarkdown`, when `essay.apply` is set, insert after the summary: `## ${APPLY_HEADING}`, `APPLY_INTRO`, the brief with every line matching `/^#{1,2} /` rewritten to start with `### `, then `## Essay`; the demo line and body follow as today. When `null`, the parts list is exactly today's. In `llmsTxt`, append to the "Request any page…" sentence group: `Essays may open with an "Apply this to your code" brief: rules for applying the essay to a codebase.` In `tools.ts`, append to `get_page`'s description: ` Essays may open with an "Apply this to your code" brief for coding agents.`
- [ ] **Step 4: Run** `pnpm test` — expected PASS (agent manifest tests that snapshot tool descriptions are updated if they fail on the new sentence, and only for it).
- [ ] **Step 5: Commit** — `feat: lead essay Markdown with its Apply brief`.

### Task 3: Menu primitive

**Files:**
- Create: `src/components/ui/menu.tsx`
- Test: `src/components/ui/menu.test.tsx`

**Interfaces:**
- Produces, all thin wrappers over `@base-ui/react/menu` with `className?: string` merged via `cn`:
  - `Menu` = `Menu.Root` (pass-through: `open`, `onOpenChange`, `modal`)
  - `MenuTrigger` (Trigger; accepts `render` so a `Button` can be the trigger)
  - `MenuPopup({ align = "end", sideOffset = 6, children, className })` — Portal → Positioner (`align`, `sideOffset`, `collisionPadding={16}`) → Popup
  - `MenuItem` (Item; pass-through `closeOnClick`, `onClick`, `label`)
  - `MenuLinkItem` (LinkItem; `href`, `target`, `rel`)
  - `MenuSeparator` (Separator)

- [ ] **Step 1: Write the failing test.** Render a `Menu` with a `MenuTrigger` "Share", one `MenuItem` "Story", a `MenuSeparator` and a `MenuLinkItem` "Claude" (`href="https://claude.ai/new"`). Tests: clicking the trigger shows `role="menu"` with two `menuitem`s; the link item has the href; pressing Escape closes the menu and focus returns to the trigger; ArrowDown moves focus from the first item to the second.
- [ ] **Step 2: Run** `pnpm vitest run src/components/ui/menu.test.tsx` — expected FAIL (module missing).
- [ ] **Step 3: Implement.** Styling from shared tokens, matching the kit's quiet look: popup `rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg min-w-52 outline-none`, `origin-(--transform-origin)` with `transition-[opacity,scale] duration-150 ease-(--ease-out) data-starting-style:opacity-0 data-starting-style:scale-95 data-ending-style:opacity-0 data-ending-style:scale-95 motion-reduce:transition-none`; items `flex h-8 pointer-coarse:h-11 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground outline-none data-highlighted:bg-muted/50 data-highlighted:text-foreground [&_svg]:size-4 [&_svg]:shrink-0`; separator `my-1 h-px bg-border`. Use the token names that exist in `globals.css` (check `popover`; fall back to `background`/`foreground` if it does not exist). Add a one-line doc comment per export like the other `ui/` files.
- [ ] **Step 4: Run** the test, `pnpm lint` — expected PASS.
- [ ] **Step 5: Commit** — `feat(ui): add Menu on Base UI`.

### Task 4: Clipboard helper and copy buttons

**Files:**
- Create: `src/lib/clipboard.ts`
- Create: `src/components/share/copy-button.tsx`
- Test: `src/lib/clipboard.test.ts`, `src/components/share/copy-button.test.tsx`

**Interfaces:**
- Produces:
  - `copyText(text: string | Promise<string>): Promise<void>` — if `window.ClipboardItem` and `navigator.clipboard?.write` exist, writes `new ClipboardItem({ "text/plain": Promise.resolve(text).then(t => new Blob([t], { type: "text/plain" })) })` synchronously within the call (so Safari keeps the gesture); else awaits the text and uses `navigator.clipboard.writeText`; if that is missing or rejects, a hidden `<textarea>` + `document.execCommand("copy")`; throws when every path fails.
  - `CopyButton({ label, copiedLabel = "Copied", failedLabel, icon, source, onPrefetch? })` — `source: () => string | Promise<string>`; `icon: LucideIcon`. Renders the kit `Button` with `aria-label` from state (`label` / `copiedLabel` / `failedLabel`), the icon / `Check` / `RotateCw`, `data-sound="tap"`, `onPointerEnter`/`onTouchStart`/`onFocus` → `onPrefetch`, and a polite `<output className="sr-only">` that reads `copiedLabel` or `failedLabel`. Copied and failed states reset to idle after 1500 ms.

- [ ] **Step 1: Write the failing tests.** `clipboard.test.ts`: uses `clipboard.write` with a `ClipboardItem` whose `text/plain` blob text equals the resolved promise (stub `ClipboardItem` as a class recording its argument); falls back to `writeText` when `ClipboardItem` is undefined; falls back to `execCommand("copy")` when `navigator.clipboard` is undefined (spy returns `true`); rejects when `execCommand` returns `false`. `copy-button.test.tsx` (fake timers): click → `source` called once, accessible name becomes "Copied", output reads "Copied", after 1500 ms the name is back to `label`; `source` rejecting → name is `failedLabel`, output reads it, and a second click calls `source` again; focusing calls `onPrefetch`.
- [ ] **Step 2: Run** `pnpm vitest run src/lib/clipboard.test.ts src/components/share/copy-button.test.tsx` — expected FAIL.
- [ ] **Step 3: Implement** both per the interfaces. `CopyButton` calls `copyText(source())` directly in the click handler (no `await` before it).
- [ ] **Step 4: Run** the tests — expected PASS.
- [ ] **Step 5: Commit** — `feat: copy buttons with a Safari-safe clipboard helper`.

### Task 5: Share menu, story-image hook and the essay header

**Files:**
- Create: `src/lib/share.ts`
- Create: `src/components/share/use-story-image.ts` (logic moved from `share-story.tsx`)
- Create: `src/components/share/essay-share.tsx`
- Delete: `src/components/share/share-story.tsx`
- Move/update: `src/components/share/share-story.test.tsx` → `src/components/share/essay-share.test.tsx`
- Test: `src/lib/share.test.ts`
- Modify: `src/app/(site)/[slug]/page.tsx` (import and header row, around line 139)

**Interfaces:**
- Consumes: `Menu*` (Task 3), `CopyButton` (Task 4), `absoluteUrl` from `@/lib/site`.
- Produces:
  - `agentPrompt(url: string, hasApply: boolean): string` — the verbatim prompts from Global Constraints.
  - `openInLinks(prompt: string): { name: "Claude" | "ChatGPT" | "Cursor"; href: string }[]` — in that order, the handoff URLs + `encodeURIComponent(prompt)`.
  - `useStoryImage(slug: string): { state: "idle" | "loading" | "ready" | "error"; label: string; prefetch(): void; share(): Promise<"done" | "retry" | "error"> }` — today's `ShareStory` logic and `LABELS` unchanged; `share` resolves `"retry"` on `NotAllowedError`, `"error"` on failure, `"done"` on success or `AbortError`.
  - `EssayShare({ slug, title, url, hasApply }: { slug: string; title: string; url: string; hasApply: boolean })`.

- [ ] **Step 1: Write the failing tests.** `share.test.ts`: `agentPrompt("https://sanding.space/button-press", true)` and `(…, false)` equal the two verbatim prompts; for a URL `https://sanding.space/a&b#c`, each `openInLinks` href starts with its base and `decodeURIComponent` of the part after `q=`/`text=` equals the prompt exactly; names are `["Claude","ChatGPT","Cursor"]`. `essay-share.test.tsx` (keep the existing fetch/navigator helpers; the four story tests now open the menu with the "Share" button and click the "Share this post as a story image" menuitem): plus
  - renders buttons named "Copy as Markdown", "Copy link", "Share";
  - "Copy link" copies `url`; "Copy as Markdown" fetches `/api/markdown/button-press` once even after focus + click, and copies its body;
  - the three "Open in…" menuitems are links with `target="_blank"`, `rel` containing `noopener`, and hrefs from `openInLinks(agentPrompt(url, hasApply))` for both `hasApply` values;
  - "Share link…" is absent without `navigator.share` and calls `navigator.share({ title, url })` with it;
  - the Safari case: first share rejects `NotAllowedError` → the menu is still open and the item is named /story image ready/i; clicking it shares and the menu closes.
- [ ] **Step 2: Run** `pnpm vitest run src/lib/share.test.ts src/components/share` — expected FAIL.
- [ ] **Step 3: Implement.**
  - `share.ts` per the interface.
  - `use-story-image.ts`: move the fetch/download/share code out of `share-story.tsx` unchanged, returning the outcome instead of only setting state.
  - `essay-share.tsx` (`"use client"`): a `flex items-center` row (`-mr-2 pointer-coarse:-mr-3.5` on the row so the last icon lines up with the column edge, as `ShareStory` did; buttons `text-subtle-foreground pointer-coarse:size-11`). `CopyButton` "Copy as Markdown" (`FileText`, `failedLabel` "Couldn't copy the Markdown. Try again"), whose source is a ref-cached `fetch(`/api/markdown/${slug}`).then(r => r.ok ? r.text() : Promise.reject())` that clears on failure and is also the `onPrefetch`; `CopyButton` "Copy link" (`Link`, `failedLabel` "Couldn't copy the link. Try again", source `() => url`). A controlled `Menu` (`open` state) with a `MenuTrigger` rendering the kit `Button` "Share" (`Share` icon, `data-sound="tap"`); opening calls `story.prefetch()`. Popup items: three `MenuLinkItem`s "Open in Claude/ChatGPT/Cursor" (lucide `ExternalLink` icon, `data-sound="tap"`), `MenuSeparator`, a `MenuItem` with `closeOnClick={false}` labelled `story.label` (icon `Image`, spinner `LoaderCircle` with `motion-safe:animate-spin` while loading, `RotateCw` on error) whose click awaits `story.share()` and closes the menu on `"done"`; and, only when `typeof navigator.share === "function"` after mount (state set in an effect, so SSR and first render match), a `MenuItem` "Share link…" (`Share2`) calling `navigator.share({ title, url })` and ignoring `AbortError`. Keep the existing polite output for the story error.
  - `page.tsx`: replace `<ShareStory slug={essay.slug} />` with `<EssayShare slug={essay.slug} title={essay.title} url={absoluteUrl(`/${essay.slug}`)} hasApply={essay.apply !== null} />`; only the boolean reaches the client.
  - Delete `share-story.tsx`.
- [ ] **Step 4: Run** `pnpm lint && pnpm typecheck && pnpm test` — expected PASS.
- [ ] **Step 5: Verify in the browser.** Start the dev server (`preview_start`), open an essay: three icons in the eyebrow row on desktop and at 375 px; Copy link and Copy as Markdown show the check and the clipboard holds the URL / Markdown; the Share menu opens aligned right inside the viewport at 375 px, arrows/Enter/Escape work and focus returns to Share; "Open in Claude" opens `claude.ai/new?q=…` in a new tab; no console errors; a page without demos still ships no demo JavaScript (network panel). Screenshot the open menu.
- [ ] **Step 6: Commit** — `feat: copy and share an essay for AI agents`.

### Task 6: Docs, Notion property and final checks

**Files:**
- Modify: `docs/spec.md` (content model: the `Apply` property; §9 essay header: the share row and menu)
- Modify: `AGENTS.md` (Interface layout → Essay line mentions the share row; Routes table agent-surface row mentions the Apply brief)

- [ ] **Step 1: Update both docs** as listed, in the style of the surrounding text (decisions marked **(decided)** in `docs/spec.md`).
- [ ] **Step 2: Ask the owner** before adding the `Apply` rich-text property to the Essays database in Notion; add it only on a yes (Notion `update-data-source`), and fill nothing in.
- [ ] **Step 3: Run** `pnpm lint && pnpm typecheck && pnpm test` — expected PASS. With `.env.local` present, `pnpm check:content` — expected PASS.
- [ ] **Step 4: Run the quality gate** from spec §11.8 on the changed UI (`better-interface`), and fix anything it finds in this branch.
- [ ] **Step 5: Commit** — `docs: Apply briefs and the essay share row`.
- [ ] **Step 6: Manual checks to report** (cannot run in CI): Safari iOS cold-tap Copy as Markdown; Lighthouse accessibility 100 on an essay page; a pasted essay URL in Claude Code fetches Markdown with the brief.

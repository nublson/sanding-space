# 010 — Cross-fade the Share story item's icon, like the copy buttons

- **Status**: DONE
- **Commit**: b67648e
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Estimated scope**: 2 files, about 30 lines changed, plus 1 test

## Problem

In the essay header's Share menu, the "Share story" item swaps its icon instantly between three states: a phone (idle or ready), a spinner (loading) and a retry arrow (error). Two buttons beside it, Copy as Markdown and Copy link, cross-fade their icons between the same kind of states. So one row of controls has two different ways of changing state. It happens occasionally (a reader sharing a story), and the instant swap reads as a flicker next to the copy buttons' fade.

```tsx
/* src/components/share/essay-share.tsx:153-170 — current */
<MenuItem
  closeOnClick={false}
  data-sound="tap"
  aria-busy={story.state === "loading"}
  onClick={shareStory}
>
  {story.state === "loading" ? (
    <LoaderCircle
      aria-hidden="true"
      className="motion-safe:animate-spin"
    />
  ) : story.state === "error" ? (
    <RotateCw aria-hidden="true" />
  ) : (
    <Smartphone aria-hidden="true" />
  )}
  {story.label}
</MenuItem>
```

`story.state` is `"idle" | "loading" | "ready" | "error"` (`src/components/share/use-story-image.ts:5`). The phone shows for both `"idle"` and `"ready"`.

## Target

All three icons stay mounted, stacked in one grid cell. The one for the current state is shown and the other two are hidden, and a change of state cross-fades. The values are copied from the copy buttons:

- shown: `scale-100 opacity-100 blur-none`
- hidden: `scale-25 opacity-0 blur-[4px]`
- `transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none`

The label text (`{story.label}`) keeps swapping instantly. Only the icon fades.

```tsx
/* target */
<MenuItem
  closeOnClick={false}
  data-sound="tap"
  aria-busy={story.state === "loading"}
  onClick={shareStory}
>
  {/* All three stay mounted in one cell, so the swap cross-fades. */}
  <span className="grid">
    {(
      [
        ["idle", Smartphone, story.state === "idle" || story.state === "ready"],
        ["loading", LoaderCircle, story.state === "loading"],
        ["error", RotateCw, story.state === "error"],
      ] as const
    ).map(([key, Glyph, shown]) => (
      <Glyph
        key={key}
        aria-hidden="true"
        data-icon={key}
        data-shown={shown}
        className={cn(
          "col-start-1 row-start-1 transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
          key === "loading" && "motion-safe:animate-spin",
          shown
            ? "scale-100 opacity-100 blur-none"
            : "scale-25 opacity-0 blur-[4px]",
        )}
      />
    ))}
  </span>
  {story.label}
</MenuItem>
```

The `as const` tuple holds a boolean computed at render. If TypeScript rejects the literal-plus-expression tuple, drop `as const` and write the array type explicitly: `[string, LucideIcon, boolean][]`, with `import type { LucideIcon } from "lucide-react"`.

## Repo conventions to follow

- The exemplar to imitate is `src/components/share/copy-button.tsx:69-90`, the stacked-icon cross-fade with `data-icon` and `data-shown` attributes. Match its classes exactly.
- `cn` comes from `@/lib/utils`. Check whether `essay-share.tsx` already imports it, and add `import { cn } from "@/lib/utils";` with the other `@/lib` imports if not.
- Menu items size their icons through `[&_svg]:size-4 [&_svg]:shrink-0` in `src/components/ui/menu.tsx:7`. Those selectors still reach the icons inside the new `<span>`, so no sizing classes are needed.
- Under reduced motion the site makes every transition instant (`docs/spec.md:506`, `src/app/globals.css:163-170`). Keep `motion-reduce:transition-none` for parity with the exemplar.

## Steps

1. In `src/components/share/essay-share.tsx`, replace the ternary inside the "Share story" `MenuItem` (the excerpt under Problem, from `{story.state === "loading" ? (` through `)}`) with the `<span className="grid">…</span>` block from Target. Keep `{story.label}` right after it, unchanged.
2. Ensure `cn` is imported in that file (see conventions).
3. In `src/components/share/essay-share.test.tsx`, add a test inside `describe("EssayShare", …)`, modeled on `copy-button.test.tsx`'s test "keeps every icon mounted and shows one at a time, for the cross-fade". It should:
   - render with `setNavigator(undefined)` so the story downloads (stub `URL.createObjectURL`, `URL.revokeObjectURL` and `HTMLAnchorElement.prototype.click` as the existing "downloads the story when files can't be shared" test does),
   - open the menu with `openMenu()`,
   - assert `storyItem().querySelectorAll("[data-icon]")` has length 3,
   - assert the only icon with `data-shown="true"` is `idle`.

## Boundaries

- Do NOT touch `src/components/share/copy-button.tsx`, `src/components/share/use-story-image.ts`, `src/components/ui/*`, or the other menu items.
- Do NOT change the labels, `aria-busy`, `closeOnClick`, `data-sound` or `onClick`.
- Do NOT add dependencies or a shared icon-swap component. Two inline copies are fine for now.
- If the code doesn't match the excerpt above (drift since b67648e), STOP and report.

## Verification

- **Mechanical**: `pnpm exec biome check src` reports no errors; `pnpm typecheck` reports 0 errors; `pnpm vitest run src/components/share` passes, including the new test and the existing story tests ("shares the story PNG and closes the menu", "stays open for a second tap when Safari refuses a late share", "shows an error and fetches the story again on retry", "drops Preparing the story once the share sheet is up").
- **Feel check**: run `pnpm dev` and open `/sand-the-back`.
  - Throttle the network to "Slow 4G" in DevTools, open the Share menu and click "Share story". The phone fades and shrinks out as the spinner fades in, with no frame where the item has no icon or two full-size icons.
  - Block `/api/story-image/*` (DevTools → Network → block request URL) and click again. The spinner cross-fades into the retry arrow.
  - At 10% speed in DevTools → Animations, the icon column never shifts sideways and the label text doesn't move while the icons fade.
  - Toggle `prefers-reduced-motion` in DevTools → Rendering. Icons swap instantly and the spinner doesn't spin, which is the site policy.
- **Done when**: the story item always holds exactly three `[data-icon]` elements, exactly one with `data-shown="true"`, and the new test passes.

# 002 — Make the clear button fade in, from a smaller scale step, and keep the fade under reduced motion

- **Status**: DONE (executed and reviewed 2026-10-28)
- **Commit**: b2581f9 (the search demo and `src/components/ui/` were uncommitted in this worktree when this was written; match on the quoted code, not line numbers)
- **Severity**: MEDIUM
- **Category**: Easing & duration / Physicality / Accessibility
- **Estimated scope**: 2 files, 2 class strings

## Correction (after review on PR #26)

Point 3 and its fix were wrong. The site's reduced-motion policy is decided in `docs/spec.md:503`: "everything above becomes instant except color changes", enforced by a global `transition-duration: 0.01ms !important` in `src/app/globals.css` (around line 162). Under reduced motion the clear button therefore appears instantly, as every transition on the site does; no fade survives. `motion-reduce:starting:scale-100` had no visible effect and was removed. Points 1 and 2 (the fade and the 0.9 scale step) stand for normal motion.

## Problem

Three issues on the search demo's clear (X) button, all in its entrance.

1. **The fade never runs.** The button sets `starting:opacity-0`, but the library `Button` transitions only `color, background-color, scale` (confirmed from the computed `transition-property`). Opacity snaps to 1, so the X appears at full strength and only grows.

   `src/components/ui/button.tsx:25` — current:
   ```tsx
   "inline-flex shrink-0 select-none items-center justify-center rounded-lg outline-none transition-[color,background-color,scale] duration-150 ease-(--ease-out) hover:bg-muted/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 motion-reduce:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
   ```

2. **The scale step is too large.** It enters from `scale-75` (0.75). Entrances should start at `scale(0.9–0.97)` with `opacity: 0`. Nothing should appear from much smaller than itself.

3. **Reduced motion removes too much.** `motion-reduce:transition-none` kills the fade and the hover color transition too. Reduced motion should drop movement (scale) but keep opacity and color.

   `src/components/demos/search-expand.tsx` (around line 101) — current:
   ```tsx
   className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full pointer-coarse:size-11 text-muted-foreground starting:scale-75 starting:opacity-0 motion-reduce:transition-none"
   ```

## Target

- Library `Button` transitions opacity too: `transition-[color,background-color,scale,opacity]`. Duration and easing stay `duration-150 ease-(--ease-out)`. The `--ease-out` token is `cubic-bezier(0.23, 1, 0.32, 1)`, and 150ms sits inside the 125–200ms budget for small elements.
- Clear button enters from `scale(0.9)` + `opacity: 0`: `starting:scale-90 starting:opacity-0`.
- Under reduced motion the entrance starts at full scale, so only the fade remains: `motion-reduce:starting:scale-100` replaces `motion-reduce:transition-none`.

```tsx
// src/components/ui/button.tsx — target (only the transition list changes)
"inline-flex shrink-0 select-none items-center justify-center rounded-lg outline-none transition-[color,background-color,scale,opacity] duration-150 ease-(--ease-out) hover:bg-muted/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 motion-reduce:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
```

```tsx
// src/components/demos/search-expand.tsx — target, the clear Button's className
className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full pointer-coarse:size-11 text-muted-foreground starting:scale-90 starting:opacity-0 motion-reduce:starting:scale-100"
```

## Repo conventions to follow

- Easing is the shared token `--ease-out` (defined in `src/app/globals.css:58`), used through Tailwind as `ease-(--ease-out)`. Do not hand-type a cubic-bezier.
- Entrances without JS use `@starting-style` through Tailwind's `starting:` variant. The clear button already does this.
- Reduced-motion handling that removes only movement already exists in the same `Button`: `motion-reduce:active:scale-100`. Imitate it.

## Steps

1. `src/components/ui/button.tsx`: in the class string, replace `transition-[color,background-color,scale]` with `transition-[color,background-color,scale,opacity]`. Change nothing else.
2. `src/components/demos/search-expand.tsx`: in the clear `Button`'s `className` (the one with `aria-label="Clear search"`), replace `starting:scale-75 starting:opacity-0 motion-reduce:transition-none` with `starting:scale-90 starting:opacity-0 motion-reduce:starting:scale-100`.
3. Run `pnpm format`, then `pnpm lint`.

## Boundaries

- Do NOT change the duration or easing of the `Button`.
- Do NOT touch `src/components/sound/mute-button.tsx` (it uses `Button` but does not depend on opacity transitions).
- Do NOT add an exit animation; the X unmounts when the query empties, which is correct for a dismissal.
- Do NOT touch the search field's layout animation (plan 001 covers that).
- If the code doesn't match the excerpts, STOP and report.

## Verification

- **Mechanical**: `pnpm lint` passes; `pnpm test` passes.
- **Computed style**: open `/demos/search-expand`, type one character, then in the console run `getComputedStyle(document.querySelector('[aria-label="Clear search"]')).transitionProperty`. It must include `opacity`.
- **Feel check**:
  - DevTools → Animations panel → 10% playback. Type a character: the X fades in from transparent while growing slightly (0.9 → 1) over 150ms. It does not pop in at full opacity.
  - Hover the X: the background and color still ease in.
  - The sidebar mute button (any site page) still presses with its scale and still swaps its icons. Its `disabled` state is never used, so the new opacity transition does not change it.
  - Rendering panel → emulate `prefers-reduced-motion: reduce`, reload, type a character: the X fades in **without** scaling (computed `scale` is `none` / `1` on the first frame), and hover color still transitions.
  - If `motion-reduce:starting:scale-100` does not win over `starting:scale-90` (check the first-frame `scale` under emulation), STOP and report the generated CSS order instead of reordering variants by guesswork.
- **Done when**: the X fades and scales in from 0.9 normally, only fades under reduced motion, and `transition-property` includes `opacity`.

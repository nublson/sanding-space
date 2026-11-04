# 009 — Let neighboring tooltips swap in place instead of replaying their entrance

- **Status**: DONE
- **Commit**: b67648e
- **Severity**: LOW
- **Category**: Purpose & frequency
- **Estimated scope**: 1 file, one class added

## Problem

The essay header's share row (Copy as Markdown, Copy link, Share) wraps its buttons in one `TooltipProvider` (`src/components/share/essay-share.tsx`). After the first tooltip opens, the provider opens the next one at once as the pointer moves along the row. Each of those follow-up tooltips still plays the full entrance: scale from 0.95 plus a fade, 150ms. Scanning the row replays the same entrance three times. A reader does this many times per session, and the repeated grow-in reads as busy. Native toolbars swap the label in place.

```tsx
/* src/components/ui/tooltip.tsx:34-37 — current */
<TooltipPrimitive.Popup
  data-slot="tooltip"
  className="origin-(--transform-origin) rounded-md border border-border bg-popover px-2 py-1 text-popover-foreground text-xs/4 shadow-md transition-[opacity,scale] duration-150 ease-(--ease-out) data-ending-style:scale-95 data-starting-style:scale-95 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none"
>
```

Base UI marks a tooltip popup that should not animate with a `data-instant` attribute. It sets it when a tooltip opens inside a provider's group window, and when one opens from focus or closes on dismiss (`node_modules/@base-ui/react/tooltip/popup/TooltipPopupDataAttributes.d.mts`: "Present if animations should be instant").

## Target

The first tooltip in a hover sequence keeps its entrance: `scale 0.95 → 1`, `opacity 0 → 1`, `150ms var(--ease-out)`, where `--ease-out` is `cubic-bezier(0.23, 1, 0.32, 1)`. Any popup carrying `data-instant` shows and hides with no transition:

```tsx
/* target — one class appended */
className="origin-(--transform-origin) rounded-md border border-border bg-popover px-2 py-1 text-popover-foreground text-xs/4 shadow-md transition-[opacity,scale] duration-150 ease-(--ease-out) data-ending-style:scale-95 data-starting-style:scale-95 data-ending-style:opacity-0 data-starting-style:opacity-0 data-instant:transition-none motion-reduce:transition-none"
```

## Repo conventions to follow

- Tailwind v4 data-attribute variants are used bare across the UI kit, e.g. `data-highlighted:bg-foreground/7` in `src/components/ui/menu.tsx:7` and `data-starting-style:scale-95` in the same popup. `data-instant:transition-none` follows the same form.
- Easing is the `--ease-out` token (`src/app/globals.css:58`); this plan doesn't change it.

## Steps

1. In `src/components/ui/tooltip.tsx`, in the `TooltipPrimitive.Popup` `className` string, insert `data-instant:transition-none` right before `motion-reduce:transition-none`. Change nothing else.

## Boundaries

- Do NOT touch `src/components/ui/menu.tsx`, `src/components/share/*`, or any other file.
- Do NOT change the delay, the side, the offset or the styling. This is a motion-property change only.
- Do NOT remove `motion-reduce:transition-none`. The site's reduced-motion policy (`docs/spec.md:506`, enforced in `src/app/globals.css:163-170`) makes every transition instant anyway, so it is redundant but harmless.
- If the `className` string doesn't match the excerpt above (drift since b67648e), STOP and report.

## Verification

- **Mechanical**: `pnpm exec biome check src` reports no errors; `pnpm typecheck` reports 0 errors; `pnpm vitest run src/components/ui/tooltip.test.tsx src/components/share` passes.
- **Feel check**: run `pnpm dev`, open any essay (e.g. `/sand-the-back`) at a desktop width with a mouse:
  - Hover Copy as Markdown and wait: its tooltip grows in from just above the icon (the 150ms entrance).
  - Without leaving the row, move to Copy link, then Share: each label appears in place at once, with no grow or fade.
  - Leave the row for a second and hover again: the first tooltip has its entrance again.
  - In DevTools → Animations at 10% speed, confirm the second and third tooltips record no transition.
- **Done when**: in DevTools, a follow-up tooltip's popup has the `data-instant` attribute and a computed `transition-property` of `none` (Tailwind v4's `transition-none` clears the property, not the duration), and the first tooltip still transitions `opacity, scale`.

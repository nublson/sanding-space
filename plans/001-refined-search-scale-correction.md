# 001 — Stop the Refined search field from stretching its own contents

- **Status**: DONE (executed with the amendment and reviewed 2026-10-28)
- **Commit**: b2581f9 (the search demo and `src/components/ui/` were uncommitted in this worktree when this was written; match on the quoted code, not line numbers)
- **Severity**: HIGH
- **Category**: Physicality & origin
- **Estimated scope**: 1 file (`src/components/demos/search-expand.tsx`), ~15 lines

## Problem

The search demo has two modes, picked by a switch: **Over-animated** and **Refined**. In both, the pill-shaped field grows from 162px to 283px wide on focus and shrinks back on blur. The resize is a Motion layout animation (`layout` prop), which animates width as `transform: scaleX()`. Everything inside the pill is scaled with it.

Measured in the browser in Refined mode: on the first frame after focus the pill is `matrix(0.572438, 0, 0, 1, 0, 0)` and the 16px search icon draws **9.2px** wide; on the first frame after blur everything draws **1.75×** wide. Icon, placeholder text, caret and the 1px side borders visibly squash and stretch for ~170ms. That is the most visible flaw in a mode whose whole point is restraint.

Over-animated mode keeps the distortion **on purpose** (it is part of what makes it over-animated, and it matches the reference recording). Fix Refined only.

Current code, `src/components/demos/search-expand.tsx` (around line 57):

```tsx
              {/* The width change animates as a scale, so the icon and text
                  stretch with the pill while it moves. Motion corrects only the
                  pill's own corner radius, set in style for that reason. */}
              <motion.div
                layout
                transition={SPRINGS[mode]}
                style={{ borderRadius: 21 }}
                className={`relative h-10.5 border border-foreground/10 bg-foreground/3 transition-colors duration-150 ease-(--ease-out) focus-within:border-foreground/25 ${open ? "w-[283px]" : "w-[162px]"}`}
              >
                <SearchIcon
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  ...
                />
                {query ? (
                  <Button
                    ...
                  </Button>
                ) : null}
              </motion.div>
```

## Target

Motion counter-scales children that themselves have a `layout` prop. The contents change aspect ratio (the input gets wider), so Motion's docs recommend `layout="position"`: position animates, size snaps to the final value, and the parent's scale is undone so nothing distorts.

- Wrap the three children (icon, `Input`, clear `Button`) in one inner `motion.div` that fills the pill: `className="absolute inset-0"`.
- Inner wrapper gets `layout={mode === "refined" ? "position" : false}` and the same `transition={SPRINGS[mode]}` as the pill, so its position tracks the pill with the identical spring.
- The pill gets `overflow-hidden`. While expanding, the inner content is already at its final 283px and is clipped by the pill's (scaled, radius-corrected) shape.
- Springs stay exactly as they are:
  - `over: { type: "spring", stiffness: 820, damping: 23, mass: 1 }`
  - `refined: { type: "spring", stiffness: 950, damping: 49, mass: 1 }`
- The pill's 1px CSS border stays a border. Do **not** move it into `boxShadow`: Motion corrects a box-shadow spread by the *average* of the x and y scale, so on this x-only scale an inset `0 0 0 1px` ring would draw ~0.73px on the sides and ~1.27px top and bottom — no better than the border. The remaining sub-pixel thinning of the side borders (to ~0.57px for the first frames, at 10% alpha) is an accepted residual.

Target code:

```tsx
              {/* The width change animates as a scale. In Refined, the contents
                  sit in a position-only layout layer that Motion counter-scales,
                  so they never stretch; the pill clips them while it grows.
                  Over-animated leaves them in the scale on purpose. Motion
                  corrects only the pill's own corner radius, set in style for
                  that reason. */}
              <motion.div
                layout
                transition={SPRINGS[mode]}
                style={{ borderRadius: 21 }}
                className={`relative h-10.5 overflow-hidden border border-foreground/10 bg-foreground/3 transition-colors duration-150 ease-(--ease-out) focus-within:border-foreground/25 ${open ? "w-[283px]" : "w-[162px]"}`}
              >
                <motion.div
                  layout={mode === "refined" ? "position" : false}
                  transition={SPRINGS[mode]}
                  className="absolute inset-0"
                >
                  <SearchIcon ... unchanged ... />
                  <Input ... unchanged ... />
                  {query ? (
                    <Button ... unchanged ...>
                      <X aria-hidden />
                    </Button>
                  ) : null}
                </motion.div>
              </motion.div>
```

## Amendment (after first execution)

The first execution matched this plan, and Refined is fixed (icon held at 16px on every frame). But after switching Refined → Over-animated, Over-animated **stopped distorting** too. Once a `motion.div` has been a layout node, setting `layout={false}` does not remove it from Motion's projection tree, so it keeps counter-scaling. A fresh load in Over-animated still distorts (icon 9.2 → 17.7px), which confirms it is the switch that leaves the correction on.

Fix: give the inner layer `key={mode}`, so it remounts with the right `layout` value whenever the mode changes. The query lives in the parent's state, so it survives the remount; focus is on the mode switch when this happens, so nothing is lost there.

Target for the inner layer:

```tsx
                <motion.div
                  // Remount on mode change: once a node has joined layout
                  // projection, layout={false} doesn't take it out again.
                  key={mode}
                  layout={mode === "refined" ? "position" : false}
                  transition={SPRINGS[mode]}
                  className="absolute inset-0"
                >
```

## Repo conventions to follow

- Motion (`motion/react`) is allowed in demos only, never site chrome. This file already imports `motion` and `MotionConfig`; no new imports are needed.
- Comments explain *why*, in plain sentences; keep the existing comment style (see the comment above `SPRINGS` in the same file).
- Formatting is Biome: `pnpm lint` / `pnpm format`.

## Steps

1. In `src/components/demos/search-expand.tsx`, find the pill `motion.div` (the one with `layout`, `transition={SPRINGS[mode]}` and `style={{ borderRadius: 21 }}`). Add `overflow-hidden` to its `className`, directly after `h-10.5`.
2. Inside that pill, wrap the three existing children — the `<SearchIcon … />`, the `<Input … />`, and the `{query ? (<Button …>…</Button>) : null}` block — in:
   ```tsx
   <motion.div
     layout={mode === "refined" ? "position" : false}
     transition={SPRINGS[mode]}
     className="absolute inset-0"
   >
     …the three children, unchanged…
   </motion.div>
   ```
   Do not change any prop or class on the three children.
3. Replace the JSX comment above the pill with the target comment from **Target**.
4. Run `pnpm format`, then `pnpm lint`.

## Boundaries

- Do NOT touch the `SPRINGS` values, the widths (`w-[283px]` / `w-[162px]`), the height, or `borderRadius: 21`.
- Do NOT change Over-animated behaviour: its contents must still stretch.
- Do NOT edit `src/components/ui/input.tsx` or `src/components/ui/button.tsx`.
- Do NOT replace the layout animation with a `width` animation.
- Do NOT add dependencies.
- If the code you find doesn't match the excerpts (drift), STOP and report instead of improvising.

## Verification

- **Mechanical**: `pnpm lint` passes; `pnpm exec tsc --noEmit -p .` shows no new errors (a pre-existing `LayoutProps` error in `src/app/layout.tsx` is unrelated); `pnpm test` passes.
- **Measured** (dev server, open `/demos/search-expand`, switch to **Refined**). In the browser console, sample every frame for 400ms after `document.querySelector('input').focus()` and record `document.querySelector('[data-slot=input]').closest('.absolute').querySelector('svg').getBoundingClientRect().width`:
  - Refined: the icon width stays **16px ± 0.5** on every frame, focus and blur.
  - Over-animated: the icon still starts near **9px** on focus and near **28px** on blur (distortion kept).
  - The pill's own width curve is unchanged: Refined peaks ~285px around 170ms and settles at 283px; blur bottoms ~160px and settles at 162px.
- **Feel check**:
  - DevTools → Animations panel → 10% playback. Focus the Refined field: the pill opens from its center while the icon and placeholder slide left with its left edge, at their normal shape. Nothing pokes outside the pill's rounded ends.
  - Blur: the pill closes around the content; the placeholder "Search…" is not cut mid-glyph at rest (162px fits it).
  - Type a query, then clear it with the X: the caret stays in the field and nothing jumps.
  - Click into the field during a collapse (interrupt): the spring reverses smoothly from where it is, contents still undistorted.
  - Rendering panel → emulate `prefers-reduced-motion: reduce`: the resize snaps with no movement in both modes (`MotionConfig reducedMotion="user"` already handles this).
- **Done when**: in Refined, the icon and text never change shape during focus/blur, Over-animated still stretches, and the springs are untouched.

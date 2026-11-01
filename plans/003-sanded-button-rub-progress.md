# 003 — Show rub progress from the first stroke

- **Status**: DONE (implemented 2026-11-01)
- **Commit**: 9fbd5e7 (the sanded-button demo was uncommitted in this worktree when this was written; match on the quoted code, not line numbers)
- **Severity**: HIGH
- **Category**: Missed opportunities (feedback)
- **Estimated scope**: 1 file (`src/components/demos/sanded-button.tsx`), ~40 lines

## Problem

The Sanded Button demo (`src/components/demos/sanded-button.tsx`) is a card you turn over; on its back, rubbing the pointer back and forth "sands" four accessibility fixes, one per 160px of rubbing. Between fixes nothing on screen changes, so the first strokes look like they do nothing and people give up. This is the main reason the demo is hard to understand.

The rubbing only counts distance:

```tsx
// src/components/demos/sanded-button.tsx, in onPointerMove — current
    if (g.mode === "rub") {
      g.rubbed += Math.hypot(dx, dy);
      if (g.rubbed >= STROKE) {
        g.rubbed -= STROKE;
        sandOne();
      }
    }
```

The grain only steps once per fix, through a CSS transition:

```tsx
// src/components/demos/sanded-button.tsx, in Back — current
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] transition-opacity duration-300 ease-(--ease-out)"
        style={{ backgroundImage: GRAIN, opacity: 0.35 * (1 - fixed / 4) }}
      />
```

And the next unchecked checklist circle is an empty dashed ring:

```tsx
// src/components/demos/sanded-button.tsx, in Back — current
                {done ? <Check className="size-2.5" strokeWidth={3} /> : null}
```

## Target

Two things follow the finger, frame by frame, with no CSS transition in the way:

1. **Grain** opacity = `0.35 × (1 − (fixed + progress) / 4)`, where `progress` is `rubbed / STROKE` (0–1) through the current stroke. So the grain visibly thins as you rub.
2. **The next unchecked circle fills**: a dot inside it (`size-2`, `bg-foreground/70`, round) with `scale = progress`, so it grows from nothing to full as the stroke completes, then the item checks.

On release mid-stroke, both ease back over **200ms** with the project's ease-out `cubic-bezier(0.23, 1, 0.32, 1)` (`[0.23, 1, 0.32, 1]` in Motion). The Sand button (no gesture) steps the grain over **300ms** with the same curve, matching today's CSS transition.

Reduced motion: rubbing is already disabled there (`onPointerDown` returns when `reduced`), so `progress` stays 0 and only the Sand button path runs. Nothing extra to gate.

## Repo conventions to follow

- Motion values and `animate` from `motion/react` already drive the card's rotation in this file: `const rotate = useMotionValue(0);` and `animate(rotate, target, { ...SPRING, velocity: rotate.getVelocity() })`. Imitate that.
- The site's ease-out is `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` in `src/app/globals.css:58`. In Motion, write it as an array constant.

## Steps

1. Near the other constants at the top of `sanded-button.tsx` (after `const SPRING = …`), add (skip any that another plan already added):

   ```ts
   /** The site's --ease-out, for Motion. */
   const EASE_OUT = [0.23, 1, 0.32, 1] as const;
   /** The back's grain before any sanding. */
   const GRAIN_OPACITY = 0.35;
   ```

2. Add `MotionValue` to the `motion/react` import as a type: `type MotionValue,`.

3. In `SandedButton`, after `const rotate = useMotionValue(0);`, add:

   ```ts
   /** How far through the current stroke the rubbing is, 0–1. */
   const progress = useMotionValue(0);
   const grain = useMotionValue(GRAIN_OPACITY);
   ```

   and after `function sandOne() { … }` add:

   ```ts
   /** Grain left for what's sanded plus the stroke in progress. */
   function showGrain(duration?: number) {
     const target =
       GRAIN_OPACITY *
       (1 - (fixedRef.current + progress.get()) / FIXES.length);
     if (duration) animate(grain, target, { duration, ease: EASE_OUT });
     else grain.set(target);
   }
   ```

4. Replace the rub branch in `onPointerMove` with:

   ```tsx
    if (g.mode === "rub") {
      g.rubbed += Math.hypot(dx, dy);
      if (g.rubbed >= STROKE) {
        g.rubbed -= STROKE;
        sandOne();
      }
      progress.set(
        fixedRef.current < FIXES.length ? g.rubbed / STROKE : 0,
      );
      showGrain();
    }
   ```

5. In `onPointerEnd`, replace `if (g.mode !== "turn") return;` with:

   ```tsx
    if (g.mode === "rub") {
      // A stroke left unfinished fades back rather than snapping.
      animate(progress, 0, { duration: 0.2, ease: EASE_OUT });
      animate(
        grain,
        GRAIN_OPACITY * (1 - fixedRef.current / FIXES.length),
        { duration: 0.2, ease: EASE_OUT },
      );
      return;
    }
    if (g.mode !== "turn") return;
   ```

6. Change the Sand button's handler from `onClick={sandOne}` to:

   ```tsx
                onClick={() => {
                  sandOne();
                  showGrain(0.3);
                }}
   ```

7. Pass the values to the back: `<Back fixed={fixed} saved={saved} />` becomes `<Back fixed={fixed} saved={saved} progress={progress} grain={grain} />`, and change `Back`'s signature to:

   ```tsx
   function Back({
     fixed,
     saved,
     progress,
     grain,
   }: {
     fixed: number;
     saved: boolean;
     progress: MotionValue<number>;
     grain: MotionValue<number>;
   }) {
   ```

8. In `Back`, replace the grain `<div …/>` with (no CSS transition: Motion drives it):

   ```tsx
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit]"
        style={{ backgroundImage: GRAIN, opacity: grain }}
      />
   ```

9. In the checklist, replace `{done ? <Check className="size-2.5" strokeWidth={3} /> : null}` with:

   ```tsx
                {done ? (
                  <Check className="size-2.5" strokeWidth={3} />
                ) : i === fixed ? (
                  // The stroke in progress fills the next circle.
                  <motion.span
                    className="size-2 rounded-full bg-foreground/70"
                    style={{ scale: progress }}
                  />
                ) : null}
   ```

## Boundaries

- Only `src/components/demos/sanded-button.tsx`. Do not touch `src/lib/sounds.ts`, the gesture classifier (`reverses`, `RUB_RUN`, `RUB_SPAN`, `STROKE`) or the rotation code.
- No new dependencies.
- If the quoted code doesn't match what you find, STOP and report instead of improvising.

## Verification

- **Mechanical**: `pnpm exec vitest run src/components/demos/sanded-button.test.tsx` passes; `pnpm lint` and `pnpm exec tsc --noEmit` are clean.
- **Feel check** at `http://localhost:3000/demos/sanded-button` (`pnpm dev`): drag the card past halfway to its back, then rub back and forth in short strokes.
  - From the very first stroke the grain thins and the "Label" circle starts filling; it never sits still while you rub.
  - When a circle fills completely it turns into the check at the same moment the sound plays. No visible jump between "full dot" and "check".
  - Stop halfway through a stroke and lift: the half-filled dot shrinks away and the grain eases back in ~200ms, not instantly.
  - After all four are sanded, rubbing changes nothing and no dot appears.
  - Press Sand (Tab to it): the grain steps down smoothly over ~300ms.
  - In DevTools Rendering, emulate `prefers-reduced-motion: reduce`, reload: the card no longer drags, Sand still works and the grain still steps.
- **Done when**: the grain and next-circle dot respond on every pointer move during a rub, and all checks above hold.

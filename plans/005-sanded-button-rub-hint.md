# 005 — Show the rub gesture once, the first time the back lands

- **Status**: DONE (implemented 2026-11-01)
- **Commit**: 9fbd5e7 (the sanded-button demo was uncommitted in this worktree when this was written; match on the quoted code, not line numbers)
- **Severity**: MEDIUM
- **Category**: Missed opportunities (explanation)
- **Estimated scope**: 1 file (`src/components/demos/sanded-button.tsx`), ~35 lines

## Problem

The Sanded Button demo (`src/components/demos/sanded-button.tsx`) is a card you turn over; on its back, rubbing the pointer back and forth sands four accessibility fixes. When the back lands, nothing says to rub it: the only cue is a "Sand" button under the card, which explains the result but not the gesture.

The back lands in `settle`:

```tsx
// src/components/demos/sanded-button.tsx, in SandedButton — current
  function settle(target: number) {
    const turned = target !== base.current;
    base.current = target;
    animate(rotate, target, { ...SPRING, velocity: rotate.getVelocity() });
    if (!turned) return;
    const nowBack = Math.abs(target / 180) % 2 === 1;
    playSound("page");
    setBack(nowBack);
    setMessage(nowBack ? "The back." : "The front.");
  }
```

## Target

The first time the back lands (by drag or by Turn), and only while something is left to sand, a ghost fingertip demonstrates the rub once:

- A 16px dot, `bg-foreground/40`, fully round, centred on the back, `aria-hidden`, `pointer-events-none`.
- After a **300ms** delay (lets the turn spring land), it sweeps sideways `x: 0 → 24 → −24 → 24 → −24 → 0` (px) over **900ms**, each segment with ease-in-out `cubic-bezier(0.77, 0, 0.175, 1)`.
- Its opacity runs `0 → 1 → 1 → 0` at `times: [0, 0.17, 0.83, 1]` over the same 900ms, linear: about 150ms in, 150ms out.
- It unmounts when the sweep ends, or immediately on any `pointerdown` on the card.
- Once per mount. Never under reduced motion (rubbing is off there; the Sand button is the path).

## Repo conventions to follow

- Motion components (`motion.span`) with `initial` / `animate` / `transition` props are how this repo's demos animate; see `src/components/demos/controls/segmented-switch.tsx` (the `motion.span` pill) for prop style.
- Ease-in-out in this repo's motion vocabulary is `cubic-bezier(0.77, 0, 0.175, 1)`.

## Steps

1. Near the constants at the top of `sanded-button.tsx`, add (skip if another plan already added it):

   ```ts
   /** A strong ease-in-out for on-screen movement, for Motion. */
   const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
   ```

2. Add a component above `function Back(`:

   ```tsx
   /** A ghost fingertip rubbing side to side, once: shows how to sand. */
   function RubHint({ onDone }: { onDone: () => void }) {
     return (
       <motion.span
         aria-hidden
         className="pointer-events-none absolute top-1/2 left-1/2 -mt-2 -ml-2 size-4 rounded-full bg-foreground/40"
         initial={{ x: 0, opacity: 0 }}
         animate={{ x: [0, 24, -24, 24, -24, 0], opacity: [0, 1, 1, 0] }}
         transition={{
           delay: 0.3,
           x: { duration: 0.9, ease: EASE_IN_OUT },
           opacity: { duration: 0.9, times: [0, 0.17, 0.83, 1], ease: "linear" },
         }}
         onAnimationComplete={onDone}
       />
     );
   }
   ```

   If Motion rejects `delay` at the top level alongside per-value transitions, put `delay: 0.3` inside both the `x` and `opacity` objects instead.

3. In `SandedButton`, after `const [message, setMessage] = useState("");` add:

   ```ts
   const [rubHint, setRubHint] = useState(false);
   const rubHinted = useRef(false);
   ```

4. In `settle`, after `setBack(nowBack);` add:

   ```ts
    if (nowBack && !reduced && !rubHinted.current && fixedRef.current < FIXES.length) {
      rubHinted.current = true;
      setRubHint(true);
    }
   ```

5. In `onPointerDown`, after the early `return` guard line, add `setRubHint(false);`.

6. Pass it to the back: `<Back fixed={fixed} saved={saved} … />` gets two more props, `rubHint={rubHint}` and `onRubHintDone={() => setRubHint(false)}`. Add both to `Back`'s props type (`rubHint: boolean; onRubHintDone: () => void;`) and render, as the last child of Back's root `<div className="relative isolate …">`:

   ```tsx
      {rubHint ? <RubHint onDone={onRubHintDone} /> : null}
   ```

   (Keep whatever other props earlier plans added to `Back`.)

## Boundaries

- Only `src/components/demos/sanded-button.tsx`. Do not change the gesture classifier, `STROKE`, the rotation or the sounds.
- The hint never loops and never plays a second time in one mount.
- No new dependencies.
- If the quoted code doesn't match what you find, STOP and report instead of improvising.

## Verification

- **Mechanical**: `pnpm exec vitest run src/components/demos/sanded-button.test.tsx` passes; `pnpm lint` and `pnpm exec tsc --noEmit` are clean.
- **Feel check** at `http://localhost:3000/demos/sanded-button`:
  - Turn the card to its back. Just after it lands, a soft dot rubs side to side twice and fades out, about a second in all.
  - Turn to the front and back again: no second hint.
  - Turn to the back and immediately press on it: the dot vanishes at once and does not block the rub.
  - The dot reads as a fingertip demonstrating, not as a control: it never catches clicks (pointer-events none).
  - In DevTools Animations at 10%, confirm the sweep eases into and out of each turn-around and never overshoots the ±24px edges.
  - Emulate `prefers-reduced-motion: reduce` and reload, press Turn: no dot.
- **Done when**: the hint plays exactly once on the first landing of the back, is dismissed by a press, and never runs under reduced motion.

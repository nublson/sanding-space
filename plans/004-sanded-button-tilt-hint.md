# 004 — Tilt the card once when it comes into view, to show it turns

- **Status**: DONE (implemented 2026-11-01)
- **Commit**: 9fbd5e7 (the sanded-button demo was uncommitted in this worktree when this was written; match on the quoted code, not line numbers)
- **Severity**: MEDIUM
- **Category**: Missed opportunities (explanation)
- **Estimated scope**: 2 files (`src/components/demos/sanded-button.tsx`, `src/components/demos/sanded-button.test.tsx`), ~45 lines

## Problem

The Sanded Button demo (`src/components/demos/sanded-button.tsx`) is a card you drag to turn over. At rest it is a flat, static card: nothing says it turns. On the essay the caption says "Drag to turn it around", but embeds have no caption.

The rotation is a motion value only the drag and the Turn button move:

```tsx
// src/components/demos/sanded-button.tsx, in SandedButton — current
  const rotate = useMotionValue(0);
  /** The settled angle: a multiple of 180, odd on the back. */
  const base = useRef(0);
```

## Target

Once per mount, when the card is first at least 50% in view, wait **600ms**, then:

1. turn to `base − 24°` over **350ms** with ease-in-out `cubic-bezier(0.77, 0, 0.175, 1)` (`[0.77, 0, 0.175, 1]` in Motion), then
2. spring back to `base` with the file's existing `SPRING` (`{ type: "spring", stiffness: 260, damping: 28 }`, bounce-free).

The hint is a reusable function, `tiltHint(delay)`, because plan 007 replays it when sanding is done.

Cancel rules: any `pointerdown` on the card or a press of Turn cancels a pending or running hint, and the user's gesture takes over from wherever the card is. Under reduced motion there is no hint at all (the visible Turn button already explains, and rotation is off there).

## Repo conventions to follow

- `src/components/demos/surface.tsx` (search `new IntersectionObserver`) observes its root to know when it's on screen; do the same, but disconnect after the first hit.
- Tests stub `IntersectionObserver` in jsdom; copy the stub from `src/components/stage/live-thumbnail.test.tsx` (top of file, `window.IntersectionObserver = class { … }`).
- Motion: `animate` from `motion/react` returns playback controls with `.stop()` and is awaitable.

## Steps

1. Near the constants at the top of `sanded-button.tsx`, add (skip if another plan already added it):

   ```ts
   /** A strong ease-in-out for on-screen movement, for Motion. */
   const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
   /** How far the hint turns the card, degrees. */
   const HINT_TILT = 24;
   ```

2. Change the motion import to include `type AnimationPlaybackControls`, and the React import to include `useEffect`.

3. In `SandedButton`, after `const fixedRef = useRef(0);`, add:

   ```ts
   const stage = useRef<HTMLDivElement>(null);
   const hintTimer = useRef<number | undefined>(undefined);
   const hintAnimation = useRef<AnimationPlaybackControls | null>(null);
   ```

4. After `function sandOne() { … }`, add:

   ```ts
   /** A small turn and back: shows the card turns. Never under reduced motion. */
   function tiltHint(delay: number) {
     if (reduced) return;
     cancelHint();
     hintTimer.current = window.setTimeout(async () => {
       if (gesture.current) return;
       const from = base.current;
       hintAnimation.current = animate(rotate, from - HINT_TILT, {
         duration: 0.35,
         ease: EASE_IN_OUT,
       });
       await hintAnimation.current;
       if (gesture.current || base.current !== from) return;
       hintAnimation.current = animate(rotate, from, SPRING);
     }, delay);
   }

   function cancelHint() {
     window.clearTimeout(hintTimer.current);
     hintAnimation.current?.stop();
     hintAnimation.current = null;
   }

   // The first time the card is half in view, tilt it once.
   useEffect(() => {
     const el = stage.current;
     if (reduced || !el) return;
     const observer = new IntersectionObserver(
       (records) => {
         if (!records.some((r) => r.isIntersecting)) return;
         observer.disconnect();
         tiltHint(600);
       },
       { threshold: 0.5 },
     );
     observer.observe(el);
     return () => {
       observer.disconnect();
       cancelHint();
     };
   }, [reduced]);
   ```

   Biome may flag the effect's dependencies (`tiltHint` is recreated each render). If it does, add `// biome-ignore lint/correctness/useExhaustiveDependencies: runs once per motion preference; tiltHint only reads refs` on the line above `useEffect`. Do not wrap the functions in `useCallback`.

5. In `onPointerDown`, after the early `return` guard line, add `cancelHint();` so a grab always wins.

6. In `turn()`, add `cancelHint();` as its first line.

7. Put the ref on the element that holds the card: `<div className="flex h-full items-center justify-center px-4 perspective-[900px]">` becomes `<div ref={stage} className="flex h-full items-center justify-center px-4 perspective-[900px]">`.

8. In `src/components/demos/sanded-button.test.tsx`, stub the observer so jsdom can render the demo. Above `describe("SandedButton", …)` add a `beforeAll` that copies the stub from `src/components/stage/live-thumbnail.test.tsx` (an `IntersectionObserver` class with no-op `observe`, `disconnect` and `unobserve`).

## Boundaries

- Only the two files above. Do not change `SPRING`, `settle`, the drag math or the Back component.
- No looping: the hint plays at most once per mount from this effect (plan 007 adds one more trigger, nothing else).
- No new dependencies.
- If the quoted code doesn't match what you find, STOP and report instead of improvising.

## Verification

- **Mechanical**: `pnpm exec vitest run src/components/demos/sanded-button.test.tsx` passes; `pnpm lint` and `pnpm exec tsc --noEmit` are clean.
- **Feel check** at `http://localhost:3000/demos/sanded-button`:
  - On load, after a short beat, the card turns a little to the left and springs back flat, once. Reloading plays it again; scrolling or waiting never repeats it.
  - The tilt reads as "this turns", not as a wobble: the turn out is smooth, the return settles with no overshoot. In DevTools Animations at 10% confirm there is no bounce past flat.
  - Press and drag the card during the hint: it follows your finger immediately from where it was, with no jump and no fight.
  - On an essay page with the demo below the fold, the hint plays when you scroll the card half into view, not on page load.
  - Emulate `prefers-reduced-motion: reduce` and reload: no tilt.
- **Done when**: the hint plays once per mount when the card is half visible, is cancelled by a grab or Turn, and never runs under reduced motion.

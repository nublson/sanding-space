# 007 — Replay the tilt hint when sanding is done, to invite turning back

- **Status**: DONE (implemented 2026-11-01)
- **Commit**: 9fbd5e7 (the sanded-button demo was uncommitted in this worktree when this was written; match on the quoted code, not line numbers)
- **Severity**: LOW
- **Category**: Missed opportunities (explanation)
- **Estimated scope**: 1 file (`src/components/demos/sanded-button.tsx`), ~20 lines
- **Depends on**: plan 004 (adds `tiltHint`, `cancelHint` and `HINT_TILT`). Do not start until 004 is done.

## Problem

The Sanded Button demo's payoff is turning the card back after sanding all four fixes and seeing the front look exactly the same. When the fourth fix lands, nothing prompts that turn: the back just sits there.

The fourth fix lands in `sandOne`, from either rubbing (inside a pointer gesture) or the Sand button (no gesture):

```tsx
// src/components/demos/sanded-button.tsx, in SandedButton — current
  function sandOne() {
    if (fixedRef.current >= FIXES.length) return;
    fixedRef.current += 1;
    setFixed(fixedRef.current);
    playSand();
    setMessage(`${FIXES[fixedRef.current - 1]} sanded.`);
  }
```

## Target

Once per mount, when all four are sanded, replay plan 004's tilt (`base − 24°` over 350ms ease-in-out `cubic-bezier(0.77, 0, 0.175, 1)`, then the existing `SPRING` back) **400ms** after the moment the user is free to turn:

- Sanded by the Sand button: 400ms after the press.
- Sanded by rubbing: 400ms after the finger lifts (a hint while the finger is still down would fight the gesture, and `tiltHint` skips itself when a gesture is active).

Reduced motion: no hint (`tiltHint` already returns early when `reduced`).

## Repo conventions to follow

- Reuse `tiltHint(delay)` from plan 004 exactly; do not write a second animation.

## Steps

1. In `SandedButton`, next to the other refs, add `const doneHinted = useRef(false);`.

2. After `function tiltHint …` (from plan 004), add:

   ```ts
   /** All sanded: tilt once more, to say "now turn it back". */
   function doneHint() {
     if (doneHinted.current || fixedRef.current < FIXES.length) return;
     doneHinted.current = true;
     tiltHint(400);
   }
   ```

3. In the Sand button's `onClick`, call `doneHint()` after `sandOne()` (keep anything else plan 003 put there, e.g. `showGrain(0.3)`).

4. In `onPointerEnd`, inside the rub branch (plan 003 adds `if (g.mode === "rub") { … return; }`; if 003 is not done, add that branch around a single call), call `doneHint()` before its `return`.

## Boundaries

- Only `src/components/demos/sanded-button.tsx`. Do not change `tiltHint`, `SPRING` or the gesture code.
- At most one replay per mount.
- No new dependencies.
- If `tiltHint` doesn't exist, STOP: plan 004 has not run.

## Verification

- **Mechanical**: `pnpm exec vitest run src/components/demos/sanded-button.test.tsx` passes; `pnpm lint` and `pnpm exec tsc --noEmit` are clean.
- **Feel check** at `http://localhost:3000/demos/sanded-button`:
  - Turn to the back and rub until all four are checked, keeping the finger down: nothing tilts while you rub. Lift: after a beat the card tilts and springs back once.
  - Reload, turn to the back and press Sand four times: the tilt plays once, shortly after the fourth press.
  - Grab the card during the tilt: it follows your finger with no jump.
  - Emulate `prefers-reduced-motion: reduce`, reload, sand everything: no tilt.
- **Done when**: finishing the sanding tilts the card exactly once, never mid-gesture, never under reduced motion.

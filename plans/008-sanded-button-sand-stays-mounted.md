# 008 — Keep the Sand button mounted so Turn never shifts

- **Status**: DONE (implemented 2026-11-01)
- **Commit**: 9fbd5e7 (the sanded-button demo was uncommitted in this worktree when this was written; match on the quoted code, not line numbers)
- **Severity**: LOW
- **Category**: Missed opportunities (preventing a jarring change, fixed without motion)
- **Estimated scope**: 2 files (`src/components/demos/sanded-button.tsx`, `src/components/demos/sanded-button.test.tsx`), ~10 lines

## Problem

Under the Sanded Button demo's card sit two buttons, Turn and Sand, in a centred row. Sand only mounts while the back is showing, so every turn makes the row change width and the Turn button jump sideways under the pointer.

```tsx
// src/components/demos/sanded-button.tsx, in SandedButton — current
          <div className="flex gap-1">
            <Button size="text" onClick={turn}>
              Turn
            </Button>
            {back ? (
              <Button
                size="text"
                disabled={fixed >= FIXES.length}
                focusableWhenDisabled
                onClick={sandOne}
              >
                Sand
              </Button>
            ) : null}
          </div>
```

## Target

No motion: Sand is always rendered, disabled on the front.

- On the front: natively disabled and out of the tab order (sanding needs the back showing).
- On the back: enabled until all four are sanded; then disabled but still focusable, so focus doesn't drop when the fourth press disables it (today's behaviour).

The project's `Button` (`src/components/ui/button.tsx`) already styles disabled as 50% opacity and blocks pointer events; Base UI's `focusableWhenDisabled` switches between native `disabled` and `aria-disabled`.

## Steps

1. Replace the conditional Sand button with:

   ```tsx
            <Button
              size="text"
              disabled={!back || fixed >= FIXES.length}
              // Keeps focus on the back when the last press disables it.
              focusableWhenDisabled={back}
              onClick={sandOne}
            >
              Sand
            </Button>
   ```

   Keep whatever `onClick` body plans 003 and 007 put there; only the conditional wrapper and the two props change.

2. In `src/components/demos/sanded-button.test.tsx`, the test asserts Sand is absent on the front:

   ```tsx
   expect(screen.queryByRole("button", { name: "Sand" })).toBeNull();
   ```

   Replace it with:

   ```tsx
   expect(screen.getByRole("button", { name: "Sand" })).toBeDisabled();
   ```

## Boundaries

- Only the button row and that one test assertion. No motion, no style changes.
- If the quoted code doesn't match what you find, STOP and report instead of improvising.

## Verification

- **Mechanical**: `pnpm exec vitest run src/components/demos/sanded-button.test.tsx` passes; `pnpm lint` and `pnpm exec tsc --noEmit` are clean.
- **Feel check** at `http://localhost:3000/demos/sanded-button`:
  - Hover the Turn button and press it repeatedly: it never moves under the pointer.
  - On the front, Sand is dimmed and Tab skips it; on the back, Tab reaches it.
  - On the back, press Sand four times with the keyboard: after the fourth, Sand dims but keeps focus.
- **Done when**: the button row has the same width on both sides and the test passes.

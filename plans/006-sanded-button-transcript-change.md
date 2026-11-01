# 006 — Make each transcript change visible: re-key the line and mark the new words

- **Status**: DONE (implemented 2026-11-01)
- **Commit**: 9fbd5e7 (the sanded-button demo was uncommitted in this worktree when this was written; match on the quoted code, not line numbers)
- **Severity**: MEDIUM
- **Category**: Missed opportunities (state indication)
- **Estimated scope**: 1 file (`src/components/demos/sanded-button.tsx`), ~40 lines

## Problem

The Sanded Button demo's back shows what a screen reader says for the card's button. Each sanded fix changes that line ("button" → "Save, button" → "Save, toggle button, not pressed"), and it's the most important result of each stroke. Today the text swaps instantly, so the change is easy to miss while your eyes are on the pointer.

```tsx
// src/components/demos/sanded-button.tsx, in Back — current
  const transcript =
    fixed >= 4
      ? `Save, toggle button, ${saved ? "pressed" : "not pressed"}`
      : fixed >= 1
        ? "Save, button"
        : "button";
```

```tsx
// src/components/demos/sanded-button.tsx, in Back — current
        <span>
          <span className="sr-only">A screen reader says: </span>“{transcript}”
        </span>
```

## Target

When `fixed` changes (and only then; toggling Save's pressed state just swaps the word):

1. The quote re-enters from `opacity: 0; y: 4px` to `opacity: 1; y: 0` over **200ms** with ease-out `cubic-bezier(0.23, 1, 0.32, 1)`. Under reduced motion, opacity only (no `y`).
2. The words this fix added get a highlight, `bg-foreground/12` with 2px rounding, that fades to transparent over **600ms** with the same ease-out after a **200ms** delay. This is a background-color fade, so it stays under reduced motion.

New words per fix: fix 1 adds `Save, `; fix 4 adds `toggle ` and `, not pressed` (or `, pressed`). Fixes 2 and 3 change no words (the ring and the hit area show on the diagram), so they re-key with no highlight.

## Repo conventions to follow

- Tailwind v4 with the `starting:` variant (`@starting-style`) is available; it gives a mount transition with no JS. Durations and easing are written as `duration-…` and `ease-(--ease-out)` throughout this file, e.g. the checklist rows: `transition-colors duration-200 ease-(--ease-out)`.
- `useReducedMotion` from `motion/react` is already imported in this file.

## Steps

1. Near the constants at the top, add (skip if another plan already added it):

   ```ts
   /** The site's --ease-out, for Motion. */
   const EASE_OUT = [0.23, 1, 0.32, 1] as const;
   ```

2. In `Back`, replace the `const transcript = …` block with word segments, each tagged with the fix that added it:

   ```tsx
   const words: { id: string; text: string; since: number }[] = [
     ...(fixed >= 1 ? [{ id: "name", text: "Save, ", since: 1 }] : []),
     ...(fixed >= 4 ? [{ id: "toggle", text: "toggle ", since: 4 }] : []),
     { id: "role", text: "button", since: 0 },
     ...(fixed >= 4
       ? [{ id: "state", text: saved ? ", pressed" : ", not pressed", since: 4 }]
       : []),
   ];
   const reduced = useReducedMotion();
   ```

3. Replace the transcript `<span>…</span>` (the one holding the sr-only prefix and `“{transcript}”`) with:

   ```tsx
        <motion.span
          key={fixed}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
        >
          <span className="sr-only">A screen reader says: </span>“
          {words.map((word) => (
            <span
              key={word.id}
              className={cn(
                word.since === fixed &&
                  fixed > 0 &&
                  "box-decoration-clone rounded-[2px] transition-colors delay-200 duration-600 ease-(--ease-out) starting:bg-foreground/12",
              )}
            >
              {word.text}
            </span>
          ))}
          ”
        </motion.span>
   ```

   Words are keyed by a stable `id`, so toggling pressed only changes the text inside the "state" span: it does not remount, so it does not glow again.

4. Check the rendered string still reads exactly as before, e.g. `“Save, toggle button, not pressed”` with no extra spaces: JSX on separate lines adds no whitespace between `“`, the map and `”` only if they are not separated by text; if a stray space appears, put `“`, the map and `”` on one line.

## Boundaries

- Only `src/components/demos/sanded-button.tsx`, only the transcript inside `Back`. Do not change the wording, the checklist, the diagram or the live region (`<output aria-live>`), which already announces each fix.
- No new dependencies.
- If the quoted code doesn't match what you find, STOP and report instead of improvising.

## Verification

- **Mechanical**: `pnpm exec vitest run src/components/demos/sanded-button.test.tsx` passes. Its assertions match the transcript with regexes like `/“Save, button”/`, so they prove the text is unchanged; `pnpm lint` and `pnpm exec tsc --noEmit` are clean.
- **Feel check** at `http://localhost:3000/demos/sanded-button`: turn to the back and press Sand four times (Tab to it).
  - Press 1: the line lifts in slightly and "Save, " glows, then the glow fades over about half a second.
  - Presses 2 and 3: the line re-enters, nothing glows.
  - Press 4: "toggle " and ", not pressed" both glow.
  - Turn to the front, press Save, turn back: "not pressed" became "pressed" with no lift and no glow.
  - In DevTools Animations at 10%, the lift is 4px, never a jump; the glow starts after the lift settles.
  - Emulate `prefers-reduced-motion: reduce`, reload, repeat: the line fades instead of lifting, the glow still fades.
- **Done when**: every fix visibly marks the transcript change and the transcript text is byte-identical to before.

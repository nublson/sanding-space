# 011 — Keep the demo stage's morph inside its box when the card opens into the essay

- **Status**: DONE (iPhone feel check pending)
- **Commit**: 7e5a7f9
- **Severity**: HIGH
- **Category**: Physicality & origin
- **Estimated scope**: 2 files, about 20 lines added

## Problem

When a reader taps an essay card on a section page, the card's demo stage morphs into the essay's large demo stage. Both sides render through `LiveThumbnail`, which wraps the stage in a named `<ViewTransition>`, so React pairs them into a shared-element transition. The stage has no styling of its own, so the browser's defaults run:

```tsx
/* src/components/stage/live-thumbnail.tsx:41-60 — current */
  return (
    <ViewTransition name={`demo-${essaySlug}`}>
      <DemoStage
        size={size}
        height={essayStageHeight(name)}
        preview={preview}
        bleed={bleed}
      >
        …
      </DemoStage>
    </ViewTransition>
  );
```

Measured on a 375px-wide viewport, the card stage is 343×171.5px and the essay stage is 375×480px, so the shape goes from about 2:1 to 0.78:1. The browser's default old and new snapshots are `width: 100%; height: auto` and nothing clips them, so each one keeps its own shape while the box between them changes:

- At the start, the new snapshot (the live demo, 480px tall) is drawn about 440px tall inside a 172px box. It spills about 270px below the card, over the card's title and summary and the "Soon" cards below. An iPhone screen recording shows the sign-up form drawn over "Sand the Back".
- At the end, the old snapshot (the card's static thumbnail) is shrunk into the top 187px of the 480px box.
- The two snapshots are different images (a static illustration and a live form), and they cross-fade linearly over the whole 250ms with `mix-blend-mode: plus-lighter`. That shows both images at once for most of the morph.

This plays on every card-to-essay tap and on every essay-to-section back navigation, which is the site's main navigation.

## Target

The stage pair gets a view transition class, `demo-stage`. Both snapshots fill the box at every frame and are cropped by it, never stretched, and never drawn outside it. The old image leaves quickly and the new one arrives on the site's page-fade timing:

```tsx
/* src/components/stage/live-thumbnail.tsx — target */
    <ViewTransition name={`demo-${essaySlug}`} share="demo-stage">
```

```css
/* src/app/globals.css — target, added after the .page-fade block */
/*
 * Card ↔ essay: the demo stage morphs between boxes of different shapes
 * (about 2:1 in a card, 0.78:1 on a phone's essay page). Both snapshots fill
 * the moving box and are cropped by it, so neither spills over the card's
 * text or squeezes into a corner. The card's image leaves fast and the
 * essay's arrives on the page fade's timing, so the two never read as one
 * double-exposed picture.
 */
::view-transition-old(.demo-stage),
::view-transition-new(.demo-stage) {
  height: 100%;
  object-fit: cover;
  overflow: clip;
  mix-blend-mode: normal;
}
::view-transition-old(.demo-stage) {
  animation: 120ms var(--ease-out) both page-fade-out;
}
::view-transition-new(.demo-stage) {
  animation: 200ms var(--ease-out) both page-fade-in;
}
```

Values:

- `--ease-out` is already defined in `src/app/globals.css:58` as `cubic-bezier(0.23, 1, 0.32, 1)`. Do not redefine it.
- `page-fade-out` and `page-fade-in` are the existing keyframes in `src/app/globals.css` (around lines 545-554: `page-fade-in` is `from { opacity: 0; }`, `page-fade-out` is `to { opacity: 0; }`). Reuse them; do not add new keyframes.
- `mix-blend-mode: normal` replaces the browser's `plus-lighter`, which only adds up correctly when both images fade on the same timing. Here they don't.

Reduced motion is already handled: the global rule at `src/app/globals.css:608-617` sets `animation-duration: 0s !important` on every `::view-transition-old(*)`, `-new(*)` and `-group(*)`. Do not add another one.

## Repo conventions to follow

- View transitions are styled through React View Transition Classes, never through `::view-transition-*(name)` selectors for app content. Exemplar: `src/components/page-fade.tsx:9-11` passes `"page-fade"` to `enter` / `exit`, and `src/app/globals.css:539-544` styles `::view-transition-old(.page-fade)` and `::view-transition-new(.page-fade)`.
- The `share` prop takes the same values as `enter` / `exit`: `"auto"`, `"none"`, a class name, or an object keyed by Transition Type. React applies the class to the shared pair only.
- Each CSS block in this region starts with a short comment explaining *why* (see the `/* Route change: … */` and `/* Sidebar navigation: … */` comments). Keep the comment in the target.

## Steps

1. In `src/components/stage/live-thumbnail.tsx`, change `<ViewTransition name={`demo-${essaySlug}`}>` to `<ViewTransition name={`demo-${essaySlug}`} share="demo-stage">`. Change nothing else in the file.
2. In `src/app/globals.css`, find the block that ends with:
   ```css
   @keyframes page-fade-out {
     to {
       opacity: 0;
     }
   }
   ```
   Directly after it, and before the `/* Sidebar navigation: … */` comment, insert the CSS target above, comment included.

## Boundaries

- Do NOT touch `src/components/page-fade.tsx`, `src/components/sidebar/mobile-shell.tsx` or the `.page-fade` / `.shell-close` rules. Plan 012 changes the page fade.
- Do NOT add any `::view-transition-group(.demo-stage)` rule. Plan 013 owns the group's timing.
- Do NOT change `DemoStage`, the card markup or the stage sizes.
- Do NOT add dependencies.
- If the `ViewTransition` line or the `page-fade-out` keyframes don't match the code you find (drift since commit 7e5a7f9), STOP and report instead of improvising.

## Verification

- **Mechanical**: `pnpm lint` reports no errors; `pnpm typecheck` reports 0 errors; `pnpm vitest run src/components/stage src/components/library` passes (`live-thumbnail.test.tsx`, `essay-card.test.tsx`, `essay-card.preview.test.tsx`, `section-block.test.tsx`).
- **Feel check** (Chrome first, then a real iPhone):
  - Run `pnpm build && pnpm start`. Dev mode does full-page reloads between these routes, so it can't show the transition. Set DevTools device emulation to a 375px-wide phone and open `/sections/principles`.
  - Click the "Sand the Back" card with a real mouse click. A scripted `element.click()` causes a full reload in some setups.
  - In DevTools → Animations, set playback to 10% and replay. At no frame is the live form drawn below the card's original bottom edge or over "Sand the Back" / the Soon cards. At no frame is the static thumbnail squeezed into the top of the big box. The card image is gone by about the middle of the morph.
  - Navigate back with the "Principles" link. The essay stage shrinks into the card with the same cropping, and nothing spills out of the box.
  - On an iPhone (Safari, Vercel preview of this branch), tap a card and watch: the stage grows as one solid box, with no form flashing over the card text.
  - In DevTools → Rendering, toggle `prefers-reduced-motion: reduce`. The navigation is instant, with no morph.
- **Done when**: in DevTools → Elements, during a paused transition, `::view-transition-old(demo-sand-the-back)` and `-new(demo-sand-the-back)` have `view-transition-class: demo-stage`, computed `height` equal to the group's, and `mix-blend-mode: normal`; and the old image's animation runs 120ms while the new one runs 200ms.

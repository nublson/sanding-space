# 012 — Let the old page leave before the new one settles, so the route fade never shows both pages

- **Status**: DONE (iPhone feel check pending)
- **Commit**: 7e5a7f9
- **Severity**: HIGH
- **Category**: Cohesion & tokens (a crossfade that visibly shows both states)
- **Estimated scope**: 1 file, 2 lines changed, 1 comment updated

## Problem

Every route change outside the sidebar crossfades the main column through `PageFade` (`src/components/page-fade.tsx`). The old page fades out and the new page fades in over the same 200ms, on the same curve, starting together:

```css
/* src/app/globals.css:538-544 — current */
/* Route change: crossfade of the main column, opacity only, 200 ms. */
::view-transition-old(.page-fade) {
  animation: 200ms var(--ease-out) both page-fade-out;
}
::view-transition-new(.page-fade) {
  animation: 200ms var(--ease-out) both page-fade-in;
}
```

Section → essay is the worst case: the two pages have unrelated text in the same place, so the section intro ("Before any colour, curve or spring…") sits under the essay's title and summary. In an iPhone screen recording at 30fps, the old intro stays readable under the new header for about 230ms (seven frames) and then disappears at the end of the transition. In Chromium the same fade measures 200ms for both sides. Because the strong ease-out front-loads the change, Chromium shows the overlap only briefly. **The reason Safari shows it so much longer was not confirmed from code.** This plan applies the fix that holds in any engine (the old page leaves clearly faster than the new one arrives) and includes an on-device check with a stop condition.

## Target

```css
/* src/app/globals.css — target */
/*
 * Route change: crossfade of the main column, opacity only. The old page
 * leaves in 120 ms while the new one arrives over 200 ms, so two pages' text
 * never reads on top of each other. No delay: the column never shows blank.
 */
::view-transition-old(.page-fade) {
  animation: 120ms var(--ease-out) both page-fade-out;
}
::view-transition-new(.page-fade) {
  animation: 200ms var(--ease-out) both page-fade-in;
}
```

Values:

- Exit 120ms, enter 200ms, no delay on either. Both stay on `var(--ease-out)`, which is `cubic-bezier(0.23, 1, 0.32, 1)` (`src/app/globals.css:58`). Do not redefine it.
- Keyframes `page-fade-out` / `page-fade-in` are unchanged.
- Reduced motion is already covered by the global rule at `src/app/globals.css:608-617`, which sets `animation-duration: 0s !important` on all view-transition pseudo-elements. Add nothing.

## Repo conventions to follow

- The sidebar-navigation fade right below it (`::view-transition-old(.shell-close)`, `src/app/globals.css:566-572`) has a comment that explains its timing, including "No delay: the two fades overlap, so the column never shows blank." Keep that no-delay rule here too.
- Comments in this region explain *why* a value was chosen. Replace the old one-line comment with the target comment.

## Steps

1. In `src/app/globals.css`, replace the comment `/* Route change: crossfade of the main column, opacity only, 200 ms. */` with the target comment.
2. In the rule directly below it, `::view-transition-old(.page-fade)`, change `200ms` to `120ms`. Leave `::view-transition-new(.page-fade)` as it is.

## Boundaries

- Do NOT change the `.shell-close` rules (sidebar navigation). They have their own slide and are out of scope.
- Do NOT change `src/components/page-fade.tsx`.
- Do NOT add a `filter: blur()` or a delay.
- Do NOT touch the `.demo-stage` rules if plan 011 has added them.
- If the `.page-fade` rules don't match the excerpt above (drift since commit 7e5a7f9), STOP and report.

## Verification

- **Mechanical**: `pnpm lint` reports no errors; `pnpm typecheck` reports 0 errors.
- **Feel check**:
  - Run `pnpm build && pnpm start` (dev mode does full-page reloads between these routes). Use 375px-wide device emulation and open `/sections/principles`.
  - Click the "Sand the Back" card with a real mouse click. In DevTools → Animations at 10% playback, the section intro is nearly gone before the essay title is fully in. At no frame are both texts at similar strength.
  - Also check `/introduction` → a section via an in-page link, and an essay → its section via the eyebrow link: same behavior, and no blank frame where the column is empty.
  - **On an iPhone (Safari, Vercel preview of this branch)**, tap the card and watch the header area. The old intro must not stay readable under "Sand the Back". **If it still does, STOP and report**: the cause on Safari is then not the timing, and needs its own investigation (for example, checking in Safari Web Inspector whether `::view-transition-old(.page-fade)` gets the `page-fade-out` animation at all).
  - In DevTools → Rendering, toggle `prefers-reduced-motion: reduce`. Route changes are instant.
- **Done when**: during a paused transition, `::view-transition-old` for the old page (`view-transition-class: page-fade`) runs `page-fade-out` for 120ms and the new page runs `page-fade-in` for 200ms, and the iPhone check passes.

# Animation plans

Written by `improve-animations` from an audit of the Refined search demo (`src/components/demos/search-expand.tsx`). The Refined spring itself (stiffness 950, damping 49: ~1% overshoot, settled in ~170ms) was judged correct and has no plan.

| # | Plan | Severity | Status |
|---|---|---|---|
| 001 | [Stop the Refined search field from stretching its own contents](001-refined-search-scale-correction.md) | HIGH | DONE |
| 002 | [Make the clear button fade in, from a smaller scale step, and keep the fade under reduced motion](002-clear-button-entrance.md) | MEDIUM | DONE |

## Execution order

1. **002** first: two class-string edits, independent, and its feel check is quick.
2. **001** second: it moves the clear button (unchanged) into a new inner wrapper. Plan 002's edit to that button's `className` survives the move, because 001 doesn't touch the button's props.

## Dependencies

None hard. Both plans edit `src/components/demos/search-expand.tsx` and match on quoted code rather than line numbers, so either order works; the order above keeps each diff small and reviewable.

# Sanded Button plans

Written by `improve-animations` from a `find-animation-opportunities` pass on the Sanded Button demo (`src/components/demos/sanded-button.tsx`), which testers found hard to understand. Every plan here explains a hidden gesture or makes a change visible; none adds decoration. All six edit the same file and match on quoted code, not line numbers.

| # | Plan | Severity | Status |
|---|---|---|---|
| 003 | [Show rub progress from the first stroke](003-sanded-button-rub-progress.md) | HIGH | SUPERSEDED |
| 004 | [Tilt the card once when it comes into view, to show it turns](004-sanded-button-tilt-hint.md) | MEDIUM | DONE |
| 005 | [Show the rub gesture once, the first time the back lands](005-sanded-button-rub-hint.md) | MEDIUM | SUPERSEDED |
| 006 | [Make each transcript change visible](006-sanded-button-transcript-change.md) | MEDIUM | DONE |
| 007 | [Replay the tilt hint when sanding is done](007-sanded-button-done-hint.md) | LOW | DONE |
| 008 | [Keep the Sand button mounted so Turn never shifts](008-sanded-button-sand-stays-mounted.md) | LOW | SUPERSEDED |

**Update 2026-11-01:** rubbing was replaced by a pressable point per fix on the back (any order, press again to undo), and the Sand button was removed. That retired 003, 005 and 008. 004, 006 and 007 still apply (007 now fires when all four points are pressed).

## Execution order

1. **008**: smallest, no motion; settles the button row the other plans add handlers to.
2. **006**: touches only the transcript inside `Back`. Its test regexes broke once the line became word spans; the test now compares the whole transcript string.
3. **003**: the highest-leverage fix; adds `EASE_OUT`, the `progress` and `grain` motion values and a rub branch in `onPointerEnd`.
4. **004**: adds `tiltHint` / `cancelHint`, an `IntersectionObserver` and its test stub.
5. **007**: reuses `tiltHint` and the rub branch from 003.
6. **005**: adds the rub hint, independent of the others.

Feel-check after 003 and after 004 before going on: the stroke length (`STROKE`, 160px) and the tilt angle (`HINT_TILT`, 24°) may need tuning by hand.

## Dependencies

- **007 needs 004** (`tiltHint`). It also prefers 003's `onPointerEnd` rub branch and says how to proceed without it.
- 003, 006 and 007 each add `EASE_OUT` or `EASE_IN_OUT` constants "if not already present"; whichever runs first adds them.
- 004 and 005 both add a line after the guard in `onPointerDown`; the second to run keeps the first one's line.

# Essay share row plans

Written by `improve-animations` from a `find-animation-opportunities` pass on the essay header's share row and Share menu (`src/components/share/`, `src/components/ui/tooltip.tsx`, `src/components/ui/menu.tsx`). The menu and tooltip entrances (scale 0.95 → 1 and a fade from the trigger, 150ms `--ease-out`) and the copy buttons' icon cross-fade were judged correct and have no plan.

| # | Plan | Severity | Status |
|---|---|---|---|
| 009 | [Let neighboring tooltips swap in place instead of replaying their entrance](009-tooltip-instant-neighbors.md) | LOW | DONE |
| 010 | [Cross-fade the Share story item's icon, like the copy buttons](010-share-story-icon-crossfade.md) | LOW | DONE |

**Not planned:** keeping an opacity fade under reduced motion for the menu, tooltips and copy icons. The site's policy is decided in `docs/spec.md:506`: *"everything above becomes instant except color changes"*, enforced by the global `transition-duration: 0.01ms !important` in `src/app/globals.css:163-170`. Changing that is a spec decision, not an animation fix.

## Execution order

1. **009**: one class in one file; quickest to feel-check.
2. **010**: the larger edit, with a new test.

## Dependencies

None. 009 edits only `src/components/ui/tooltip.tsx`; 010 edits only `src/components/share/essay-share.tsx` and its test.

# Section → essay route transition plans

Written by `improve-animations` from an iPhone screen recording of the section → essay navigation (frames at 30fps) and timings measured on sanding.space in Chromium at 375px wide. The stage morph runs between boxes of different shapes on the browser's defaults, and the page crossfade fades both pages over the same time, so both are visible at once. The shell's sidebar slide (`.shell-close`) and the mobile header's stand-still group were judged correct and have no plan.

| # | Plan | Severity | Status |
|---|---|---|---|
| 011 | [Keep the demo stage's morph inside its box when the card opens into the essay](011-demo-stage-morph-aspect.md) | HIGH | DONE (iPhone check pending) |
| 012 | [Let the old page leave before the new one settles](012-page-fade-exit-first.md) | HIGH | DONE (iPhone check pending) |
| 013 | [Put the demo stage's morph on the site's ease-out curve](013-demo-stage-morph-timing.md) | MEDIUM | DONE (iPhone check pending) |

**Not planned:** on the recorded iPhone, about 330ms pass between the tap and the first frame of the transition (55ms in Chromium on desktop). That is most likely the network fetching the essay's content, not motion. Confirm it in Safari Web Inspector (Network, with the tap) before planning a prefetch change.

## Execution order

1. **011**: the largest visible fix, and it adds the `demo-stage` class.
2. **013**: one rule on the class from 011.
3. **012**: independent; run it last so its iPhone check sees the stage already fixed, and any leftover overlap is clearly the page fade.

## Dependencies

- **013 needs 011** (`share="demo-stage"` and the `.demo-stage` rules).
- 012 is independent. It edits the `.page-fade` rules next to where 011 inserts its block; both match on quoted code, not line numbers.
- Test on `pnpm build && pnpm start` or a Vercel preview, with a real click: `pnpm dev` does full-page reloads between these routes, so the transition never plays there.

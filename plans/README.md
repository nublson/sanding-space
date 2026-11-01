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

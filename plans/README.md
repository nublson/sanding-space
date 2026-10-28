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

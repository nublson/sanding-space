# Surface pressure and demo controls

Date: 2026-10-28. Status: approved design, awaiting spec review.

## Goal

Demos should let readers switch a property on and off and see the difference in place. The first use: the Surface demo gains a **pressure** input and **guides** that show the press depth. An essay chooses, per embed, which of the two controls appear and where they start.

The visual pattern comes from three reference demos: the subject in the middle, a two-option segmented switch with a sliding pill below it, and an optional dashed "Guides" chip above it that lights up when on. The references use a blue accent; this site does not (spec §10), so guides use the foreground ink.

## Decisions

- **Shared kit, not inline.** The controls live in a small kit every demo can use. The frame stays stage + caption only (spec §9); controls are part of the demo, so chromeless embeds keep them.
- **Pressure without pressure hardware** (mouse, trackpad, plain touch, keyboard): pressure builds with hold time. A pen uses its real `PointerEvent.pressure`.
- **Surface's guides**: a dashed ring at the pointer's full reach (the radius where the push ends), with the 0.00–1.00 value beside it.
- **Two kinds of demo params**: **presets**, shared names with one meaning across every demo (first and only one: `guides`), and **demo props**, owned by one demo (Surface: `pressure`). See "Params: presets and demo props".
- **Route params show a control and set its start**: `?pressure=off|on`, `?guides=off|on`. No param, no control, and the demo behaves exactly as today.

## Params: presets and demo props

Demo params (everything except the reserved frame params `theme`, `bg`, `chrome`) come in two kinds.

**Presets** have one name, one control and one start-state rule across every demo. What turning one on *shows* belongs to each demo.

| Preset | Control | Values | Surface shows | A Button demo might show |
|---|---|---|---|---|
| `guides` | `GuidesToggle` chip, top slot | `on`, `off` (unknown → `off`) | Reach ring + press value | Dashed padding boxes, labelled gaps |

Each preset has a hook in the kit that reads the param and owns the state and the control, so demos never re-implement it:

```ts
useGuides(params): { guides: boolean; control: ReactNode | null }
```

`control` is `null` when the param is absent (and `guides` is then `false`). A new preset is added only when a second demo needs the same shared control.

**Demo props** belong to one demo and mean whatever that demo says. They use `SegmentedSwitch` and `readChoice` directly. Surface owns `pressure` (`off` → Press, `on` → Pressure). A centering demo could own `align`, for example.

**Rule** (added to AGENTS.md under "Rules that are easy to break"): demos may use a preset name only with its shared meaning, and never the frame param names.

URL examples:

| URL | Result |
|---|---|
| `/demos/surface` | The dot field alone, same as today |
| `/demos/surface?pressure=off` | Field + switch, starting on Press |
| `/demos/surface?guides=on` | Field + Guides chip, starting on |
| `/demos/surface?pressure=on&guides=on` | Field + both controls, both starting on |

## Non-goals

- No other demo adopts the kit in this change.
- No locked states (a fixed value with no control visible).
- No changes to the frame, the stage, `demo-meta.ts` heights, or frame params.
- No variable pressure from touch force.

## 1. Controls kit

New folder `src/components/demos/controls/`.

- **`DemoLayout`**: stacks an optional `top`, the subject and an optional `bottom`, centred. The subject fills the remaining height.
- **`SegmentedSwitch`**: props `options: [{ value, label }, { value, label }]`, `value`, `onChange`, `label` (accessible group name). Built on Base UI `ToggleGroup` in single mode. Base UI allows un-pressing the active item (empty value); the switch ignores that change, so one option is always active. The active pill is a `motion/react` element with a shared `layoutId` that slides between options and jumps instantly under reduced motion. Arrow keys move focus (Base UI). A press plays `tap`.
- **`GuidesToggle`**: props `pressed`, `onChange`. Built on Base UI `Toggle` (`aria-pressed`). Dashed border, lucide `Crosshair` icon, label "Guides". When on, its text turns foreground, its dashed border foreground at 40%, with a faint foreground fill (the same 7% as the switch pill). Plays `toggle-on` / `toggle-off`.
- **`useGuides(params)`**: the `guides` preset hook described above. It reads the param with `readChoice`, holds the state and returns the `GuidesToggle` element for the demo's top slot.
- **Guide colour**: none of its own. Controls and measures (rings, values, outlines) use the foreground ink like the rest of the site (spec §10), and so follow `?theme` for free.
- Everything else uses theme tokens (muted text, foreground, border, secondary surface for the pill).

New helper in `src/lib/params.ts`, next to `readNumber`:

```ts
readChoice<T extends string>(params, key, choices: readonly T[], fallback: T): T | undefined
```

Returns `undefined` when the key is absent (the demo hides that control), the value when it is one of `choices`, otherwise `fallback`.

## 2. Surface

**Params.** The demo prop `pressure` is read with `readChoice(params, "pressure", ["off", "on"], "off")`; the `guides` preset comes from `useGuides(params)`. Absent: the control is hidden and its state is fixed (Press mode, Guides off). Present: the control is shown and starts at the given value; an unknown value starts at `off`.

**State.** `mode: "press" | "pressure"` (React state in Surface) and `guides: boolean` (from `useGuides`) are changed by the controls. The canvas effect still mounts once and reads both through refs; a change wakes the frame loop instead of rebuilding the field.

**Physics** (`surface-field.ts`, pure functions):

- `easePress(press, target: number, dt, tau?)` eases toward a number in 0–1 instead of a boolean. Press mode keeps `PRESS_IN` 0.16 s / `PRESS_OUT` 0.05 s; Pressure mode follows faster (about 0.05 s both ways) so a pen does not lag.
- `pressTarget({ down, mode, heldFor, penPressure })`:
  - not down → 0
  - Press mode → 1
  - Pressure mode, pen → `penPressure` (only read while down, since a hovering pen reports 0)
  - Pressure mode, anything else → `min(1, heldFor / HOLD_TIME)`, `HOLD_TIME` = 1.2 s
- `reach(press)` = `RADIUS + press × RADIUS_PRESS`, used by `integrate` and by the guides ring so the ring never drifts from the push.

`heldFor` is accumulated in the frame loop while down and reset on release. Keyboard Space counts as a held press.

**Idle check.** The loop's "steady" test compares `press` with the current `pressTarget(...)` instead of `down ? 1 : 0`, so a held mouse in Pressure mode keeps animating until the hold has fully built.

**Layout.** Surface renders inside `DemoLayout`: the `useGuides` control on top only with `guides`, the canvas in the middle, `SegmentedSwitch` ("Press" / "Pressure", label "Press mode") at the bottom only with `pressure`. The registered stage height stays 336 px; with both controls the field is about 240 px tall. The canvas `aria-label` names the active mode.

Sounds are unchanged: a press on the field still plays `tap`.

## 3. Surface's guides, edge cases, testing

**Drawing.** In the existing `draw()` pass, when Guides is on and there is a pointer or keyboard cursor: a 1 px dashed circle of radius `reach(press)` around it, and `press.toFixed(2)` in Geist Mono 12 px at the ring's upper right, clamped inside the stage. Colour is the canvas `currentColor` (foreground) the dots already use; the ring reads apart from the dots by its dash and full opacity. Toggling Guides draws once even when the loop is idle.

**Accessibility.** The Guides chip announces its pressed state; the switch is a labelled group with arrow-key movement. No live region for the value (it would announce every frame). Respect `prefers-reduced-motion` (pill jumps; field keeps its existing reduced damping).

**Edge cases.**

| Case | Behaviour |
|---|---|
| `?pressure=yes` | Control shown, starts at `off` |
| Pen hovering | Pressure ignored until down |
| Mode switched mid-press | Target changes; depth eases to it |
| Space held in Pressure mode | Builds like a held mouse |
| `?guides=yes` | Chip shown, starts off |
| Frame params | Untouched; `pressure` and `guides` don't collide with `theme`, `bg`, `chrome` |

**Tests.**

- Unit (Vitest): `pressTarget` every branch; numeric `easePress`; `reach`; `readChoice` absent / valid / invalid.
- Component: `SegmentedSwitch` keeps one option active and ignores an un-press; `GuidesToggle` flips `aria-pressed`; `useGuides` returns no control without the param, a chip starting on/off with it; Surface renders each control only when its param is present.
- Browser: `/demos/surface`, `?pressure=on`, `?guides=on`, both, and `?theme=light`, in the preview.
- `pnpm lint` and the full test suite pass.

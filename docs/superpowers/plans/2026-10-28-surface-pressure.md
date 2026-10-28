# Surface Pressure and Demo Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give demos in-place controls (a shared `guides` preset and per-demo segmented switches), and use them to add a pressure input and a reach-ring guide to the Surface demo.

**Architecture:** A small kit in `src/components/demos/controls/` (layout, segmented switch, guides chip, `useGuides` hook) plus `readChoice` in `src/lib/params.ts`. Surface's physics stays pure in `surface-field.ts` (new `pressTarget`, `reach`, numeric `easePress`); `surface.tsx` wires params → state → refs → the existing frame loop and draws the ring in its existing `draw()` pass.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind v4 tokens, Base UI (`@base-ui/react` toggle, toggle-group), `motion/react`, lucide-react, Vitest + Testing Library (jsdom), Biome, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-28-surface-pressure-design.md`

## Global Constraints

- No params → Surface renders exactly as today: no controls, Press mode, guides off.
- Param values are `on` / `off`; an unknown value shows the control, starting at `off`.
- Frame params `theme`, `bg`, `chrome` are never read by demos.
- `motion/react` only inside `src/components/demos/**`; never Radix; icons from lucide.
- Sounds only from `src/lib/sounds.ts`: switch press `tap`, Guides `toggle-on` / `toggle-off`, field press `tap` (unchanged).
- Site chrome is monochrome; the guide blue exists only as `--demo-guide`, used only inside demos.
- Respect `prefers-reduced-motion` (pill jumps, no slide).
- Constants: `HOLD_TIME` = 1.2 s; Pressure-mode ease tau = 0.05 s both ways; Press mode keeps `PRESS_IN` 0.16 s / `PRESS_OUT` 0.05 s; `reach(press)` = `RADIUS + press * RADIUS_PRESS` (60 + press × 50).
- Labels: switch options "Press" / "Pressure", group label "Press mode"; chip label "Guides".
- `pnpm lint` and `pnpm test` pass after every task.

## Review Focus

- A hovering pen reports `pressure` 0 → must not push; `pressTarget` ignores pen pressure while not down (test in Task 2).
- Releasing in Pressure mode → depth must return to exactly 0 so the loop can idle (test in Task 2).
- Switching mode mid-press → depth eases to the new target, never jumps (test in Task 2).
- `?guides=yes` / `?pressure=maybe` → control shown, starting off; never crash or hide (tests in Tasks 1, 3, 4).
- Held mouse in Pressure mode → the loop must keep animating until the hold has built; the steady check uses `pressTarget` (Task 4, Step 4 browser check: hold 1.2 s, ring keeps growing to 110 px).

---

### Task 1: `readChoice` param helper

**Files:**
- Modify: `src/lib/params.ts`
- Test: `src/lib/params.test.ts`

**Interfaces:**
- Produces: `readChoice<T extends string>(params: Record<string, string>, key: string, choices: readonly T[], fallback: T): T | undefined`

- [ ] **Step 1: Write the failing test** in `src/lib/params.test.ts`:

```ts
describe("readChoice", () => {
  const choices = ["off", "on"] as const;
  it("is undefined when the key is absent", () => {
    expect(readChoice({}, "guides", choices, "off")).toBeUndefined();
  });
  it("reads a listed value", () => {
    expect(readChoice({ guides: "on" }, "guides", choices, "off")).toBe("on");
    expect(readChoice({ guides: "off" }, "guides", choices, "off")).toBe("off");
  });
  it("falls back for unlisted and empty values", () => {
    expect(readChoice({ guides: "yes" }, "guides", choices, "off")).toBe("off");
    expect(readChoice({ guides: "" }, "guides", choices, "off")).toBe("off");
  });
});
```

- [ ] **Step 2: Run** `pnpm vitest run src/lib/params.test.ts` — Expected: FAIL, `readChoice` is not exported.
- [ ] **Step 3: Implement** `readChoice` in `src/lib/params.ts` with the signature above (exact, case-sensitive match).
- [ ] **Step 4: Run** `pnpm vitest run src/lib/params.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: readChoice reads an enumerated demo param`

---

### Task 2: Pressure physics in `surface-field.ts`

**Files:**
- Modify: `src/components/demos/surface-field.ts`
- Modify: `src/components/demos/surface.tsx` (only the `easePress` call sites, so the build stays green)
- Test: `src/components/demos/surface-field.test.ts`

**Interfaces:**
- Produces:
  - `export type PressMode = "press" | "pressure"`
  - `export const HOLD_TIME = 1.2`
  - `export function reach(press: number): number` — `RADIUS + press * RADIUS_PRESS`; `integrate` uses it instead of its inline radius.
  - `export function pressTarget(input: { down: boolean; mode: PressMode; heldFor: number; penPressure: number | null }): number` — not down → 0; `press` mode → 1; `pressure` mode with `penPressure !== null` → `penPressure` clamped to 0–1; otherwise `min(1, heldFor / HOLD_TIME)`.
  - `export function easePress(press: number, target: number, dt: number, mode?: PressMode): number` — `press` mode (default): tau `PRESS_IN` when rising, `PRESS_OUT` when falling; `pressure` mode: tau 0.05 both ways. Snaps to `target` within 0.001 (as today).

- [ ] **Step 1: Write the failing tests.** Change the two existing `easePress` tests to pass `1` / `0` instead of `true` / `false`, then add:

```ts
describe("reach", () => {
  it("is 60px at rest and 110px fully pressed", () => {
    expect(reach(0)).toBe(60);
    expect(reach(1)).toBe(110);
    expect(reach(0.5)).toBe(85);
  });
});

describe("pressTarget", () => {
  const base = { down: true, mode: "pressure" as const, heldFor: 0, penPressure: null };
  it("is 0 when not down, even for a hovering pen", () => {
    expect(pressTarget({ ...base, down: false, penPressure: 0.8 })).toBe(0);
    expect(pressTarget({ ...base, down: false, mode: "press" })).toBe(0);
  });
  it("is 1 in press mode while down", () => {
    expect(pressTarget({ ...base, mode: "press", heldFor: 0 })).toBe(1);
  });
  it("follows the pen in pressure mode", () => {
    expect(pressTarget({ ...base, penPressure: 0.35 })).toBe(0.35);
    expect(pressTarget({ ...base, penPressure: 1.4 })).toBe(1);
  });
  it("builds with hold time without a pen", () => {
    expect(pressTarget({ ...base, heldFor: 0 })).toBe(0);
    expect(pressTarget({ ...base, heldFor: HOLD_TIME / 2 })).toBeCloseTo(0.5);
    expect(pressTarget({ ...base, heldFor: HOLD_TIME * 3 })).toBe(1);
  });
});

describe("easePress in pressure mode", () => {
  it("follows faster than press mode sinks in", () => {
    let p = 0, q = 0;
    for (let f = 0; f < 3; f++) {
      p = easePress(p, 1, FRAME, "pressure");
      q = easePress(q, 1, FRAME, "press");
    }
    expect(p).toBeGreaterThan(q);
  });
  it("returns to exactly 0 after release", () => {
    let p = 0.7;
    for (let t = 0; t < 0.5; t += FRAME) p = easePress(p, 0, FRAME, "pressure");
    expect(p).toBe(0);
  });
  it("eases, never jumps, when the target changes mid-press", () => {
    const next = easePress(1, 0.3, FRAME, "pressure");
    expect(next).toBeLessThan(1);
    expect(next).toBeGreaterThan(0.3);
  });
});
```

- [ ] **Step 2: Run** `pnpm vitest run src/components/demos/surface-field.test.ts` — Expected: FAIL (`reach`, `pressTarget`, `HOLD_TIME` not exported; `easePress` type error).
- [ ] **Step 3: Implement** the Interfaces above in `surface-field.ts`. In `surface.tsx` change only `easePress(press, input.down, dt)` → `easePress(press, input.down ? 1 : 0, dt)`; behaviour is unchanged.
- [ ] **Step 4: Run** `pnpm vitest run src/components/demos/surface-field.test.ts && pnpm lint` — Expected: PASS (existing `stepField` tests still pass, since `reach` equals the old inline radius).
- [ ] **Step 5: Commit** `feat: Surface physics takes a pressure target`

---

### Task 3: Controls kit

**Files:**
- Create: `src/components/demos/controls/demo-layout.tsx`
- Create: `src/components/demos/controls/segmented-switch.tsx`
- Create: `src/components/demos/controls/guides-toggle.tsx`
- Create: `src/components/demos/controls/use-guides.tsx`
- Modify: `src/app/globals.css` (add `--demo-guide` to `.dark`, `.light`, and the `.theme-system` light block)
- Modify: `AGENTS.md` ("Rules that are easy to break")
- Test: `src/components/demos/controls/controls.test.tsx`

**Interfaces:**
- Consumes: `readChoice` (Task 1); `playSound` from `@/lib/sounds`.
- Produces:
  - `DemoLayout({ top, bottom, children }: { top?: ReactNode; bottom?: ReactNode; children: ReactNode })` — a full-size flex column, centred; `top`/`bottom` render only when given; `children` sit in a `relative min-h-0 flex-1 self-stretch` slot, so a canvas can fill it. The root keeps `w-full self-stretch` (see the comment in `surface.tsx` on why not `height: 100%`).
  - `SegmentedSwitch<T extends string>({ label, options, value, onChange }: { label: string; options: readonly [{ value: T; label: string }, { value: T; label: string }]; value: T; onChange: (value: T) => void })` — Base UI `ToggleGroup` (single) with `aria-label={label}`, a `Toggle` per option; an empty `onValueChange` is ignored; a real change calls `onChange` and `playSound("tap")`. The active option holds a `motion.span` with `layoutId` unique per instance (`useId()`), transition `{ type: "spring", duration: 0.3, bounce: 0 }`, or `{ duration: 0 }` when `useReducedMotion()`.
  - `GuidesToggle({ pressed, onChange }: { pressed: boolean; onChange: (pressed: boolean) => void })` — Base UI `Toggle`, lucide `Crosshair` icon (`aria-hidden`), text "Guides", dashed `border-border` pill with `text-muted-foreground`; when pressed, text and border use `var(--demo-guide)` and the background is `color-mix(in oklch, var(--demo-guide) 12%, transparent)`. Plays `toggle-on` / `toggle-off`.
  - `useGuides(params: Record<string, string>): { guides: boolean; control: ReactNode | null }` — `readChoice(params, "guides", ["off", "on"], "off")`; absent → `{ guides: false, control: null }`; present → state initialised to `value === "on"` and a `GuidesToggle` bound to it.
  - CSS: `--demo-guide` = `oklch(0.72 0.15 240)` in `.dark`, `oklch(0.55 0.17 250)` in `.light` and the `.theme-system` light block. Check each against the stage background for ≥ 3:1 (non-text UI) and the chip label for ≥ 4.5:1; adjust lightness if not.

- [ ] **Step 1: Write the failing tests** in `controls.test.tsx` (mock `@/lib/sounds` with `vi.mock`, and assert `playSound` calls):
  - `SegmentedSwitch` renders a group named "Press mode" with "Press" `aria-pressed="true"`; clicking "Pressure" calls `onChange("pressure")` and `playSound("tap")`; clicking the already-active "Press" calls nothing.
  - `GuidesToggle` with `pressed={false}`: clicking calls `onChange(true)` and `playSound("toggle-on")`; with `pressed`, clicking calls `onChange(false)` and `playSound("toggle-off")`.
  - `useGuides` (via a tiny harness component rendering `control` and `String(guides)`): `{}` → no "Guides" button, text `false`; `{ guides: "on" }` → button `aria-pressed="true"`, text `true`; `{ guides: "yes" }` → button `aria-pressed="false"`; clicking it flips the text to `true`.
  - `DemoLayout` renders `top` before `children` before `bottom` in document order, and renders neither slot when omitted.
- [ ] **Step 2: Run** `pnpm vitest run src/components/demos/controls` — Expected: FAIL, modules not found.
- [ ] **Step 3: Implement** the four files and the CSS variable per Interfaces. Use Context7 (`/mui/base-ui`) for the exact `Toggle` / `ToggleGroup` import paths and `pressed` / `onPressedChange` props before writing.
- [ ] **Step 4: Add the AGENTS.md rule** under "Rules that are easy to break", after the frame-params bullet: `- **Demo param presets** (\`guides\`) mean the same control in every demo (\`useGuides\` in \`src/components/demos/controls\`); what turning one on shows is up to each demo. Demos may use a preset name only with that meaning.`
- [ ] **Step 5: Run** `pnpm vitest run src/components/demos/controls && pnpm lint` — Expected: PASS.
- [ ] **Step 6: Commit** `feat: demo controls kit with a shared guides preset`

---

### Task 4: Surface uses the kit

**Files:**
- Modify: `src/components/demos/surface.tsx`
- Test: `src/components/demos/surface.test.tsx` (create)

**Interfaces:**
- Consumes: `DemoLayout`, `SegmentedSwitch`, `useGuides` (Task 3); `readChoice` (Task 1); `pressTarget`, `easePress`, `reach`, `PressMode` (Task 2).
- Produces: `Surface({ params }: DemoProps)` — same default export and registry name.

Wiring decisions:
- `const pressure = readChoice(params, "pressure", ["off", "on"], "off")`; `mode` state starts `pressure === "on" ? "pressure" : "press"`; switch shown only when `pressure !== undefined`, options `[{ value: "press", label: "Press" }, { value: "pressure", label: "Pressure" }]`, label "Press mode".
- `const { guides, control } = useGuides(params)`.
- `mode` and `guides` reach the mount-once effect through refs (`modeRef`, `guidesRef`) updated in a `useEffect`; that effect also calls a `wakeRef.current?.()` the main effect assigns, so a change draws/animates even when the loop is idle.
- `Input` gains `heldFor: number` (reset to 0 on every down, accumulated by `dt` in `tick` while down) and `penPressure: number | null` (set from `e.pressure` on pen `pointerdown`/`pointermove`, `null` otherwise and for keyboard).
- In `tick`: `const target = pressTarget({ down: input.down, mode: modeRef.current, heldFor: input.heldFor, penPressure: input.penPressure })`; `press = easePress(press, target, dt, modeRef.current)`; the steady test uses `press === target` in place of `press === (input.down ? 1 : 0)`.
- In `draw()`, after the dots, when `guidesRef.current` and there is a pointer or `input.key`: 1 px dashed circle (`setLineDash([4, 4])`), radius `reach(press)`, stroke `guideColor`; then `press.toFixed(2)` in `12px "Geist Mono", ui-monospace, monospace`, fill `guideColor`, at the ring's upper right (angle −45°, 6 px outside), clamped to `[4, width − textWidth − 4]` × `[14, height − 4]`. Reset line dash afterwards.
- `guideColor` is read with `getComputedStyle(canvas).getPropertyValue("--demo-guide")` in `readColor()`, so it re-reads on resize and colour-scheme change like `color` does.
- Canvas `aria-label`: today's `LABEL` in Press mode; in Pressure mode `"A field of dots that yields under your pointer. Press harder, or hold longer, to push deeper; arrow keys move, Space presses."`.
- Render: `<DemoLayout top={control} bottom={switch}>` around the existing canvas; the outer `data-stream` div stays the root (move `ref={rootRef}` to the slot that holds the canvas so `resize()` measures the field, not the whole stage).

- [ ] **Step 1: Write the failing tests** in `surface.test.tsx` (jsdom has no 2D context, so the effect exits early and only markup is tested; mock `@/lib/sounds`):
  - `params={{}}` → no "Guides" button, no "Press mode" group, canvas `aria-label` equals today's label.
  - `params={{ pressure: "on" }}` → "Pressure" `aria-pressed="true"`; canvas label mentions "Press harder".
  - `params={{ pressure: "maybe", guides: "yes" }}` → both controls shown; "Press" is the active option (`aria-pressed="true"`) and "Guides" is off (`aria-pressed="false"`).
  - `params={{ guides: "on" }}` → "Guides" `aria-pressed="true"`, no switch.
- [ ] **Step 2: Run** `pnpm vitest run src/components/demos/surface.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement** the wiring above in `surface.tsx`.
- [ ] **Step 4: Run** `pnpm test && pnpm lint` — Expected: PASS.
- [ ] **Step 5: Browser check.** `preview_start` the dev server, then on `/demos/surface`:
  - no params: identical to `develop` (no controls, same press feel);
  - `?pressure=on`: mouse hold builds over ~1.2 s and keeps animating until full; release returns to rest; switching to Press mid-hold eases;
  - `?guides=on`: ring is 60 px at rest, 110 px fully pressed, value tracks 0.00–1.00, keyboard cursor shows the ring too;
  - `?pressure=on&guides=on&theme=light`: guide blue readable on the light stage;
  - console has no errors; reduced motion (DevTools emulation) makes the pill jump.
- [ ] **Step 6: Commit** `feat: Surface gets pressure and guides controls`

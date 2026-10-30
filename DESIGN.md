# Design System: Sanding Space
**Project ID:** `sanding.space` (repo `nublson/sanding-space`; tokens in `src/app/globals.css`, components in `src/components/ui/`)

This file is the prose source of truth for how Sanding Space looks and behaves, written so a designer, an agent or a prompt can produce a new screen that belongs. Exact values sit in parentheses after every description. Where a value here disagrees with the code, the code is right and this file is stale: fix it in the same change. Section numbers in brackets point at the longer rationale in [docs/spec.md](docs/spec.md).

## 1. Visual Theme & Atmosphere

**A quiet workshop at night.** Sanding Space is a dark, achromatic reading room for short essays about design engineering, each built around a live demo. The chrome is deliberately unremarkable so the demos, which may use color and motion freely, are the only things that glow.

- **Mood:** focused, refined, alive to the touch. Reading is calm; every press is answered with a small motion and a short mechanical sound.
- **Density:** airy. One narrow column of text, generous vertical rhythm (56px between blocks, 48px on phones), a slim sidebar, nothing else on screen.
- **Hierarchy without color:** there is no accent hue anywhere in the chrome. Importance is carried by ink lightness (three steps of grey text), weight (regular vs medium) and size, never by a tint.
- **Materials:** matte and flat. Surfaces are a half-step lighter than the page, outlined with a hairline, with no drop shadows at rest. Nothing is glossy, gradient or blurred.
- **Dark only.** The site has no light mode and no theme toggle. Light tokens exist solely so a demo embedded on someone else's light page can match its host.
- **Reference lineage:** the author's portfolio (nublson.com) for type and tokens; devouringdetails.com for the sidebar-and-column structure; craft.gustavofior.com for details like scroll fades.

## 2. Color Palette & Roles

The palette is called **silicon carbide**, after the near-black of wet-and-dry sandpaper. Every color is a neutral grey defined in OKLCH with zero chroma; the hex values below are their sRGB equivalents and are what the Open Graph images and app icons use.

### Dark (the site)

| Descriptive name | Value | Role |
|---|---|---|
| **Silicon carbide** | `oklch(0.178 0 0)` (#111111) | Page background, browser theme color, app-icon tile. |
| **Chalk** | `oklch(0.946 0 0)` (#ededed) | The ink and the brand color. Headings, bold text, current sidebar item, the current-essay bar, link hover state, wordmark, solid button fill. 16.1:1 on the background. |
| **Pencil grey** | `oklch(0.7 0 0)` (#9e9e9e) | Body copy, intros, summaries, published essays in the sidebar, resting icon buttons, input placeholders. Also the focus ring. 7.1:1. |
| **Pumice** | `oklch(0.64 0 0)` (#8c8c8c) | Quiet labels: eyebrows, captions, the section Question, card summaries, non-current sidebar sections, Soon items, links at rest. The dimmest text allowed, 5.6:1. |
| **Raised grain** | `oklch(0.218 0 0)` (#1a1a1a) | The one surface tone: demo stage, inline code, card hover fill, popovers, button hover fill. Shared by `card`, `muted`, `secondary`, `accent`, `popover`. |
| **Hairline** | `oklch(0.248 0 0)` (#212121) | Default 1px border: stage outline, sidebar guide line, dividers, inline-code edge. Barely there by design. |
| **Field edge** | `oklch(0.53 0 0)` (#6c6c6c) | Input borders and the dashed Soon outline (at 50% alpha). Deliberately stronger than Hairline so a field reads as a control at 3:1. |
| **Chalk, pressed** | `oklch(0.922 0 0)` (#e5e5e5) on `oklch(0.205 0 0)` (#171717) | `primary` and `primary-foreground`: a filled control and its label. |
| **Ember** | `oklch(0.704 0.191 22.216)` (≈ #f87171) | The only hue in the chrome: invalid-field border and error text. Never decorative. |
| **Image outline** | `oklch(1 0 0 / 0.1)` | A 10% white edge drawn on raster images and favicons so they never float. |

Tinted fills are made from the ink, not from new colors: a toggle pressed is Chalk at 7% (`bg-foreground/7`), a toggle-group item pressed is Chalk at 10%, a card hover is Raised grain at 50%, a solid button hover is Chalk at 85%.

### Light (demo embeds only, `?theme=light` or `?theme=system` on a light host)

Paper `oklch(0.985 0 0)` (#fafafa) background; Graphite `oklch(0.205 0 0)` (#171717) ink; body text `oklch(0.439 0 0)` (#525252); subtle `oklch(0.55 0 0)` (#717171); surface `oklch(0.955 0 0)` (#f0f0f0); hairline `oklch(0.94 0 0)` (#ebebeb); field edge `oklch(0.62 0 0)` (#868686); ring `oklch(0.556 0 0)` (#737373); error `oklch(0.505 0.213 27.518)` (≈ #b91c1c). Same roles, same contrast floors.

### Rules

- Demos may use any color inside their stage. The chrome around them may not.
- Never introduce a dimmer text tone than Pumice; Soon items use Pumice, not opacity.
- Never recolor the brand mark. It is always `currentColor`.

## 3. Typography Rules

Three faces, loaded with `next/font/google`, each with one job.

- **Inter** (`--font-sans`, normal and italic) is the interface and reading face. Features `cv11` and `ss01` are on everywhere (single-storey a, open digits), tracking is slightly tight (-0.008em body, -0.006em on phones, -0.01em headings).
- **Newsreader** (`--font-heading`, optical-size axis) appears in exactly one place: the essay title. A serif at display size over a sans body is the one typographic flourish.
- **Geist Mono** (`--font-mono`) is for code and for small technical labels such as the "Soon" pill.

**Scale.** One body size rules the site: 16px on a 26px line, for chrome and reading text alike. Everything steps relative to it, and **below 768px every size drops two pixels** (body 14/22).

| Element | Desktop | Phone |
|---|---|---|
| Essay title (Newsreader, balanced, tracking -0.015em) | 32/38 | 28/34 |
| Lede (essay summary) | 18/28 | 16/26 |
| Page titles, wordmark, card titles (Inter 500) | 16 on a 32px line | 14 on a 28px line |
| Body, sidebar rows, intros | 16/26 | 14/22 |
| Body headings h2, h3 (Inter 500, Chalk) | 18/28 | 16/26 |
| Body headings h4, h5 (Inter 500, Chalk) | 16/24 | 14/20 |
| Eyebrow, captions, section Question, labels | 14/20 | 12 to 13 |
| Card summaries | 14/22 | 13/20 |
| Inline code (Geist Mono) | 0.875em of the body | same |

**Weight and ink carry structure.** Body copy is Pencil grey at regular weight; headings and bold are Chalk at medium (500). No heavier weight is used anywhere. Headings are never smaller than the text beneath them.

**Alignment detail.** Top-level page titles share the sidebar wordmark's exact type and 32px line box, so title and wordmark sit on one baseline across the two columns.

**Wrapping.** Titles use `text-wrap: balance`, prose uses `text-wrap: pretty`. Links in prose are underlined with a from-font hairline offset 4px. External links in Notion text carry the destination's favicon before the text.

## 4. Component Stylings

All components are the project's own, written on **Base UI** primitives in `src/components/ui/`, styled with the shared tokens. Icons are **lucide** at 16px with a 1.5 stroke. There are no shadcn components and no Radix.

**Corner language.** One radius token (`--radius: 0.625rem`, 10px) drives a scale: softly rounded (`rounded-lg`, 10px) for controls and stages, generously rounded (18px) for a card's hover halo so it stays concentric with the 10px stage inside it, and **pill-shaped** (`rounded-full`) for chips, segmented switches and toggle items. Inline code gets a tight 6px.

**Depth.** Flat. There are no shadows at rest anywhere. Layering is expressed by a half-step lighter surface (Raised grain) plus a Hairline border. The single shadow in the system is the whisper-soft one under the keyboard skip link when it appears.

* **Buttons (`Button`):** quiet by default: an icon in Pencil grey with no fill, 32px square (28px small), softly rounded. On hover the icon turns Chalk and a 50% Raised grain fill appears; on press it shrinks to 96%. The `solid` variant is the one filled control, used for a form's single action: Chalk fill with Silicon carbide text, 36px tall, medium weight, dimming to 85% on hover. Disabled is 50% opacity and no press scale.
* **Links in prose:** Pumice at rest, Chalk on hover, 150ms. Arrow glyphs nudge 1 to 2px in the direction the link travels, on fine pointers only.
* **Inputs (`Input`):** 36px tall, transparent background, 1px Field edge stroke, softly rounded, 12px side padding. Hover lifts the stroke to Pencil grey; focus turns it to the ring color with a 2px ring at 30%. Invalid shows an Ember stroke until focused, and the error text, not the ring, is what marks the field. Text is 16px on touch screens so iOS never zooms.
* **Labels (`Label`):** Inter 500, 14/20, Chalk, above the control.
* **Toggle (`Toggle`):** a **dashed pill chip** in Hairline with Pencil grey text and a 16px icon. Pressed: the dash firms to Chalk at 40%, the fill is Chalk at 7%, the text is Chalk. This is the standard demo on/off control, for example the Guides chip.
* **Toggle group (`ToggleGroup`):** a row of 32px round icon buttons (44px on touch) at 70% opacity; the pressed one sits at full ink on a Chalk 10% disc. Arrow keys move between items.
* **Segmented switch (demo control):** two pill radio options, 16px side padding, Pencil grey text; a Chalk 7% pill slides to the active option with a short, bounce-free spring (300ms). Tab lands on the active option.
* **Demo stage (`DemoStage`):** the one frame every demo lives in. Raised grain fill, 1px Hairline, 10px radius, content centered. Essay stages take the demo's registered height (420px without one); section cards hold a 2:1 (hero) or 4:3 (grid) aspect ratio. On phones the essay stage bleeds edge to edge and drops its corners. Caption 13/20 Pumice, centered, 10px below.
* **Soon stage:** the same frame unfilled, with a dashed Field edge stroke at 50% alpha, the demo's static thumbnail at 40% opacity if it has one, and a "Soon" pill top-left (12px Geist Mono, Pumice, dashed outline). Not a link, no cursor, no sound.
* **Essay card:** no border, no fill at rest. On fine pointers the hover reveals a 50% Raised grain halo extending 8px beyond the stage at an 18px radius. Title Inter 500 Chalk, summary Pumice. Press scales the whole card to 98% and plays `page`.
* **Sidebar:** 192px column, 160px of content, sticky, starting 128px from the top. Wordmark is the 20px shaving mark plus "Sanding Space" in Inter 500. Rows are 32px tall (44px on touch), full-width hit areas. Sections in Pumice, the current one in Chalk with its Question beneath in 14/20 Pumice. Essays hang behind a 1px Hairline guide line, Published in Pencil grey, Soon in Pumice as plain text, and the current essay in Chalk with a 2 × 14px Chalk bar sitting on the guide line. The footer is Resources, About and a 32px mute button. No scrollbars anywhere: the list fades 2.5rem at whichever edge still has content.
* **Mobile header:** 56px fixed bar with a 44px toggle button (lucide `PanelLeft`) and the lockup at the phone scale (18px mark, Inter 14 medium). The sidebar pushes the content right, never overlays it.
* **Resource row:** 16px favicon with the image outline, name in Chalk 500, description in Pencil grey on one truncated line, the whole row a link that fills Raised grain on hover and presses to 98%.
* **Brand mark:** the **shaving**, a single curl of material lifted off the work, hinting at an S without spelling it. One `currentColor` stroke, 5 units wide with round caps in a 48-unit box, never animated, never recolored. Mark height is about 1.4 × cap height in the lockup.

## 5. Layout Principles

- **One column, one right edge.** Content lives in a 672px column. Text, demos, embeds, images, code and tables all fill that width so every block shares the same right edge. Phones get a 16px gutter; the essay stage is the only element allowed to break it.
- **Vertical rhythm from a fixed ladder.** The essay page stacks its parts 48px apart (`gap-12`); body blocks sit 56px apart per the spec (48px on phones); 24px between a section heading and its grid, 32px between card rows, 24px between card columns. Cards show 10px of air between stage and title and 2px between title and summary.
- **Two anchored tops.** Sidebar and content both start 128px from the top on desktop and 64px below the 56px header on phones, so the wordmark and the page title align.
- **Section page:** full intro, the first essay as a large 2:1 card, the rest in a 3-column grid (2 columns under 640px, with the third skeleton hidden). Introduction uses the same layout.
- **Essay page:** 32px eyebrow row with the section link, the Newsreader title, the lede, the demo stage with caption, then a Hairline rule and the body.
- **Sidebar grammar:** the current item is read from the URL; only the current section is expanded (a `0fr → 1fr` grid animation, 200ms), and the current essay is marked with a bar rather than a fill.
- **Hit areas** are at least 32px on fine pointers and 44px on touch, achieved by growing the row, not by padding the text.
- **Whitespace is the frame.** Nothing is boxed unless it is a demo. Dividers are rare and always Hairline.

## 6. Motion & Sound

Motion is CSS first, with React `<ViewTransition>` for route changes. `motion/react` is used inside demos only. Animate `transform`, `opacity`, `color` and `background-color` only. The house curve is `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`; the mobile push uses a spring-like `linear()` curve of about 400ms.

| Moment | Feel | Timing |
|---|---|---|
| First load | page blocks rise 6px and fade in, staggered 60ms | 500ms |
| Route change | crossfade of the main column | 200ms |
| Card → essay | the thumbnail morphs into the essay stage (shared element) | 350ms |
| Current essay changes | the sidebar bar slides to the new row | 250ms |
| Press on rows, cards | scale to 98% | 160ms |
| Press on small buttons | scale to 96% | 160ms |
| Hover on links, buttons, cards | ink to Chalk, fill appears, arrows nudge | 150ms |
| Mobile sidebar | content slides right on the push curve | ~400ms |
| Streamed content | opacity-only fade, no shimmer | 200ms |

**Sound** is on by default and synthesized with `@web-kits/audio`; there are no audio files. Five gestures, each a short mechanical sound rather than a note: `tap` (a dry tick, non-navigating presses), `page` (a sheet settling, every navigation), `toggle-on` and `toggle-off` (a switch click, the off one duller), and `hover` (a quieter tick, sidebar items only, mouse only). One sound per gesture, never on focus, scroll or load, and a mute button in the sidebar footer that persists. Sound never carries information that is not also visible.

**Rejected** as decoration: hover sounds outside the sidebar, scroll reveals, parallax, cursor followers, logo animation, shimmering skeletons, hover effects on live thumbnails, animated focus rings.

## 7. Accessibility Floor

- Lighthouse 100 on essay and demo pages.
- Every text tone meets AA on its background; Pumice is the floor.
- Focus ring: 2px in the ring color, offset 2px, square-ish corners, instant and never animated.
- `prefers-reduced-motion` collapses every animation and view transition to instant; color changes remain. Reduced motion does not mute sound.
- Skip link, `<nav aria-label="Sections">`, `<main id="main-content">`, `aria-current="page"` on the current item, `aria-pressed` on toggles, `inert` page content while the mobile sidebar is open, Escape closes it and returns focus.

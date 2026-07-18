# H&H Learning Framework — Design System

The visual language of the interactive *Art of Electronics* curriculum
(github.com/dchaplinsky/H-H). Source of truth is `shared/hh.css` and
`shared/hh.js` in that repo; `styles.css` / `hh.js` here are synced copies.

## Principles

- **Token-only color.** Every color is a CSS custom property with light and dark
  values (`prefers-color-scheme` + `data-theme` override). Components and SVG
  schematics never hardcode hex.
- **Validated series palette.** The 8 categorical slots use a CVD-safe fixed
  order. Electronics semantics on top: voltage = slot 1 (blue),
  current = slot 2 (green), power/heat = slots 6/8.
- **Four panel voices.** Physics (violet), analogy (green), rules of thumb
  (blue), task (amber) — a fixed color-coded pedagogy so learners know what
  kind of text they're reading before they read it.
- **System sans + mono.** No webfonts (offline-first). Mono for code, formulas,
  and tabular figures.
- **Recessive chrome.** Grids, axes, and borders sit in the muted/hairline
  range; data series and interactive affordances carry the color.

## Cards

- `guidelines/cards/` — colors (surfaces/ink, series, status/washes), typography
- `components/cards/` — panels, quiz states, widget shell, live canvas plot,
  schematic SVG style, design-bench task card, hub cards + progress

## Updating

Edit in the repo, re-copy `styles.css`/`hh.js`, and re-sync changed cards via
DesignSync. Keep this project incremental — never wholesale-replace.

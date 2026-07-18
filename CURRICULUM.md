# The Art of Electronics — Interactive Learning Framework

A self-paced, browser-native companion to Horowitz & Hill's *The Art of Electronics*
(3rd edition). The book is the depth; these modules are the intuition, the practice,
and the feedback loop.

## Design principles

1. **Bite-sized.** One module ≈ one sitting (45–90 min). Each covers a coherent slice
   of one book chapter, cited in its header.
2. **Self-contained apps.** Every module is a single HTML file that runs from
   `file://` — no build step, no server, no network. Shared CSS/JS lives in
   `shared/` via relative links, so the whole repo is portable. When hosted
   over HTTP(S), a service worker (`sw.js`) precaches everything, making the
   app installable and fully offline-capable on phones.
3. **Mobile-first ergonomics.** Responsive layout to 390 px, coarse-pointer
   touch targets, and touch-scrub on every interactive plot.
4. **Fixed pedagogical spine.** Every module follows the same arc:
   - *Why this matters* — motivation before mechanism
   - *Physics background* (violet panel) — the underlying physics, honestly but briefly
   - *Core concepts* — the H&H material, distilled, with schematics
   - *Real-world analogy* (green panel) — plumbing and friends, **including where the
     analogy breaks** (analogies that hide their limits create misconceptions)
   - *Interactive labs* — sliders + live schematics + live plots; the goal is to play
     until the behavior stops being surprising
   - *Rules of thumb* (blue panel) — the estimation habits H&H are famous for
   - *Quiz* — immediate feedback with explanations for both right and wrong answers
   - *Design bench* — real schematic-design tasks done on paper first, with worked
     solutions behind a disclosure
5. **Estimation over calculation.** Following H&H's own ethos: every module drills
   "roughly what current/voltage/power is this?" reflexes.
6. **Progress without accounts.** `localStorage` tracks visits, best quiz scores,
   missed questions, and completed tasks; the hub (`index.html`) renders it. A module
   counts as *complete* at quiz ≥ 75% plus all bench tasks checked.
7. **Light spaced repetition.** The hub surfaces a *Continue* card (most recently
   visited incomplete module) and *Review due* cards: any quiz below 75%, or an
   imperfect quiz older than 3 days, links straight back to that module's quiz.

## Repository layout

```
index.html                  ← curriculum hub + progress dashboard
CURRICULUM.md               ← this file
shared/
  hh.css                    ← design tokens (light+dark), panels, quiz, widgets
  hh.js                     ← quiz engine, progress store, plot/slider helpers
modules/
  NN-slug.html              ← one self-contained module per file
```

## Shared runtime API (for module authors)

```js
HH.initModule("NN")               // register visit, wire data-task checkboxes
HH.slider(id, {log, format, onchange})  // bound range input with live value label
HH.plot(canvas, cfg).draw(series, extras) // gridded canvas plot, hover readout
HH.quiz("quiz", [{q, opts, answer, expl}, …]) // MCQ with feedback + score persistence
HH.fmt(0.0047, "A")               // → "4.7 mA" engineering notation
HH.progress.get/set/all           // localStorage-backed progress store
```

Conventions: voltage traces use `--series-1` (blue), current `--series-2` (green),
power/heat `--series-6`/`--series-8` (orange/red). Schematics are inline SVG using
the `.schematic` classes. All colors come from CSS custom properties so dark mode
works automatically.

## Curriculum map

Status: ✅ built · 🔜 planned

### Part I — Foundations (AoE Ch. 1)

| # | Module | Book | Status |
|---|--------|------|--------|
| 01 | Voltage, Current & Ohm's Law | §1.1–1.2 | ✅ |
| 02 | Voltage Dividers, Kirchhoff & Thévenin | §1.2.3–1.2.6 | ✅ |
| 03 | Capacitors & RC Circuits | §1.4 | ✅ |
| 04 | Inductors & Transformers | §1.5 | ✅ |
| 05 | Impedance, Reactance & Passive Filters | §1.7 | ✅ |
| 06 | Diodes & Diode Circuits | §1.6 | ✅ |
| 07 | Reading & Drawing Schematics | App. B + practice | ✅ |

### Part II — Transistors (AoE Ch. 2–3)

| # | Module | Book | Status |
|---|--------|------|--------|
| 08 | The BJT as a Switch | §2.1–2.2 | 🔜 |
| 09 | Emitter Followers & Current Sources | §2.2–2.3 | 🔜 |
| 10 | The Common-Emitter Amplifier | §2.2–2.3 | 🔜 |
| 11 | Differential Pairs, Mirrors & Push-Pull | §2.3–2.4 | 🔜 |
| 12 | FETs: JFETs & MOSFETs | §3.1–3.2 | 🔜 |
| 13 | FET Switches & Analog Switching | §3.4–3.5 | 🔜 |

### Part III — Op-Amps & Precision (AoE Ch. 4–6)

| # | Module | Book | Status |
|---|--------|------|--------|
| 14 | Op-Amp Golden Rules | §4.1–4.2 | 🔜 |
| 15 | The Op-Amp Toolbox | §4.3 | 🔜 |
| 16 | Comparators & Schmitt Triggers | §4.3.2, §12.3 | 🔜 |
| 17 | Active Filters | Ch. 6 | 🔜 |
| 18 | Op-Amp Imperfections & Precision Design | §4.4, Ch. 5 | 🔜 |

### Part IV — Signals & Power (AoE Ch. 7, 9)

| # | Module | Book | Status |
|---|--------|------|--------|
| 19 | Oscillators & Timers | Ch. 7 | 🔜 |
| 20 | Linear Voltage Regulators | §9.1–9.3 | 🔜 |
| 21 | Switching Converters | §9.6 | 🔜 |
| 22 | Power Circuits & Heat | §9.4, §9.8 | 🔜 |

### Part V — Digital Electronics (AoE Ch. 10–13)

| # | Module | Book | Status |
|---|--------|------|--------|
| 23 | Logic Gates & Boolean Algebra | §10.1–10.2 | 🔜 |
| 24 | Combinational Logic Design | §10.3 | 🔜 |
| 25 | Flip-Flops & Sequential Logic | §10.4 | 🔜 |
| 26 | Counters & State Machines | §10.5–10.6 | 🔜 |
| 27 | Logic Families & Interfacing | Ch. 10, 12 | 🔜 |
| 28 | Digital Meets Analog: ADCs & DACs | Ch. 13 | 🔜 |

### Part VI — The Real World (AoE Ch. 8, 12, 15)

| # | Module | Book | Status |
|---|--------|------|--------|
| 29 | Noise & Low-Noise Design | Ch. 8 | 🔜 |
| 30 | Grounding, Shielding & EMI | §8.5–8.6, App. H | 🔜 |
| 31 | Microcontrollers & the Modern Bench | Ch. 15 | 🔜 |

## Authoring a new module

1. Copy the structure of `modules/01-voltage-current-resistance.html`.
2. Keep the spine order (motivation → physics → concepts → analogy → interactives →
   rules → quiz → bench). Every section is mandatory; interactives ≥ 1, quiz ≥ 6
   questions, bench ≥ 3 tasks with solutions.
3. Every analogy must state where it breaks.
4. Every numeric example must be verified (do the arithmetic twice).
5. Register the module in `index.html`'s `PARTS` array (add `file:` to flip it from
   planned → available), and link it into the prev/next footer chain.
6. Add the new file to the `FILES` list in `sw.js` and bump `CACHE_VERSION`,
   so the offline precache picks it up.
7. Update the status table above.

## Deliberate scope choices

- **3rd edition** section numbers; the module content is edition-agnostic.
- Chapter 5 (precision) and Chapter 8 (noise) are compressed into single modules —
  they are reference chapters; the modules teach the mental models and point back.
- Chapters 11/14 (programmable logic, computers) are folded into modules 27/31 —
  the book's treatment is dated; the concepts survive in the interfacing modules.
- SPICE is intentionally absent: the labs are purpose-built toys with zero setup.
  A "export this circuit to a simulator" pointer per module is a possible future step.

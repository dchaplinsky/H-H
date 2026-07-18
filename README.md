# The Art of Electronics — Interactive Learning Framework

Master Horowitz & Hill, one bite-sized module at a time.

Each module is a **self-contained HTML app** — physics background, distilled
explanations, real-world analogies (plumbing and friends), interactive labs with
live schematics and plots, a quiz with explanations, and hands-on schematic
design tasks with worked solutions.

## Quick start

No build, no server, no dependencies:

1. Clone the repo.
2. Open `index.html` in a browser.
3. Start with Module 01. Progress (quiz scores, completed tasks) is saved in
   your browser's localStorage.

Dark mode follows your OS preference automatically.

## Offline & mobile

- **Zero network by design** — no CDNs, fonts, or external resources anywhere,
  so opening the files locally already works with no connection at all.
- **Installable PWA** — when hosted over HTTP(S) (GitHub Pages works great),
  a service worker precaches the entire app on first visit: add it to your
  phone's home screen and every module keeps working with no connection.
- **Mobile-friendly** — responsive layout down to small phones, big touch
  targets, and touch-scrubbing on the interactive plots (drag a finger across
  a graph to read values).

## What's here

- `index.html` — curriculum hub with a progress dashboard
- `modules/` — the learning modules (Part I under construction, 3 of 31 built)
- `shared/` — the tiny framework every module uses (design tokens, quiz engine,
  plot helpers, progress store)
- `CURRICULUM.md` — the full 31-module curriculum map, design principles, and
  the guide for authoring new modules

*The book is the depth; these modules are the intuition, the practice, and the
feedback loop. Pair each module with the book sections cited in its header.*

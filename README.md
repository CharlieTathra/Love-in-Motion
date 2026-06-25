# Love in Motion

> Because Love Keeps Moving — an endurance journey in support of the **McGrath Foundation**.

**🌐 Live site:** https://charlietathra.github.io/Love-in-Motion/

A small hub of self-contained web apps supporting the training and fuelling for
**Kuranda → Port Douglas** (60 km trail ultra · 23 Aug 2026), with the 415 km
Attunga → Sydney run on the horizon.

## Pages

| Page | Live link | What it is |
| --- | --- | --- |
| **Home** | https://charlietathra.github.io/Love-in-Motion/ | Countdown, journey timeline, and links to everything below |
| **Fuel** | https://charlietathra.github.io/Love-in-Motion/nutrition-meal-planner/ | Daily fuelling protocol — meals, snacks, on-run fuel and recovery, across Plan A/B/C |
| **Train** | https://charlietathra.github.io/Love-in-Motion/training/ | Phase-by-phase build to 60 km — Base / Build / Peak / Taper |
| **Donate** | https://www.pinkisthecolour.com.au/fundraisers/LoveINMotion | The fundraiser, in support of the McGrath Foundation |

## How it works

- Three standalone `index.html` files (home, `nutrition-meal-planner/`, `training/`).
- No build step — each file works opened directly in a browser and offline.
- Progress (meals eaten, sessions done) is saved in the browser, with an
  in-memory fallback when storage is unavailable. The Plan A/B/C choice is
  shared between the Fuel and Train apps.
- Deployed to GitHub Pages automatically on every push to `main`
  (`.github/workflows/deploy-pages.yml`).

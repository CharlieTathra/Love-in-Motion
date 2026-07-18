# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, no-build PWA hub for the **Love in Motion** endurance campaign (a 45 km practice run on 1 Nov 2026 and the 500 km Attunga → Sydney run on 23 Dec 2026, fundraising for the McGrath Foundation). Live at https://charlietathra.github.io/Love-in-Motion/.

There is **no build step, no package.json, no tests, and no linter**. Every page is a fully self-contained `index.html` (inline CSS + inline ES5-style JavaScript) that works opened directly in a browser and offline. To verify a change, open the file in a browser (e.g. `python3 -m http.server` from the repo root — a server is needed for the service worker, not for the pages themselves).

## Deployment

Every push to `main` deploys the **repo root** to GitHub Pages via `.github/workflows/deploy-pages.yml`. There is no artifact filtering — anything committed at the root is published, including the `.docx`/`.pdf` campaign documents (which are intentional, linked downloads).

## The pages

| Path | App |
| --- | --- |
| `index.html` | Home — countdown, timeline, links |
| `nutrition-meal-planner/` | "Fuel" — daily fuelling protocol across Plans A/B/C |
| `meals/` | Serve-based meal builder |
| `training/` | 24-week training plan with week tabs, session check-offs, notes |
| `the-500/` | The Attunga → Sydney campaign (route, crew camps, multi-day plan) |
| `donate/` | Fundraiser page |
| `the-415/` | Redirect stub only — the event grew from 415 km to 500 km; it meta-refreshes to `../the-500/`. Don't add content here. |

## Architecture

### Self-contained pages, duplicated conventions

Each `index.html` carries its own full `<style>` block and script. There is no shared stylesheet — the design system (CSS custom properties `--cream`, `--ink`, `--rose`, `--euc`, `--clay`, etc.; Fraunces serif + Hanken Grotesk sans from Google Fonts; `max-width:520px` mobile-first layout) is **duplicated per page**. A visual change to the shared look must be applied to every page consistently. JavaScript is deliberately old-style (`var`, IIFEs, no modules, `"use strict"`) — match that idiom.

### Storage layer (`supabase-sync.js`)

The only shared JS file. It exposes `window.LIMStorage.create(scopeName, onRemoteSync)` and every stateful page creates a store from it (`"app"`, `"train"`, `"meals"`). The store:

- reads/writes localStorage keys prefixed **`limn_`**, with an in-memory fallback when storage is unavailable;
- optionally syncs the whole `limn_*` snapshot to a Supabase table `lim_app_state` (upsert keyed by `scope`, debounced 700 ms) **only if** the page defines `window.LIM_SUPABASE_URL` / `LIM_SUPABASE_ANON_KEY` before loading `supabase-sync.js`. Without them it is purely local — never make Supabase required.

Key conventions: `limn_plan` holds the Plan A/B/C selection and is **shared between the Fuel and Train apps** (changing it in one changes the other); `limn_train2_done_w*` / `limn_train2_note_w*` hold training progress/notes; `limn_eaten_d*` holds meals eaten; `meals/` uses `limn_meal_plan`. New persisted state must use the `limn_` prefix or it won't sync or survive the snapshot logic.

### Service worker (`sw.js`)

One service worker at the root, registered by every page (as `../sw.js` from subdirectories). It precaches the app shell listed in `PRECACHE` — pages are network-first, static assets cache-first.

**When you change any precached file (any page, the docs, `supabase-sync.js`, icons), bump `VER` in `sw.js`** (e.g. `limn-v26` → `limn-v27`), or returning visitors keep the stale cached copy. If you add a new page or root-level document, add it to `PRECACHE` too.

### Everything else

- The `.docx`/`.pdf` files at the root (route book, training plan, safety audit, sponsorship prospectus, travel-strength one-pager) are generated campaign documents served as downloads — they are referenced from the pages and precached by the service worker.
- `media/campaign/` holds hero graphics built on the locked `love-in-motion-design` system; its README documents the brand rules (approved McGrath logo usage, no invented event dates, placeholder pink). Don't hand-edit these PNGs — they are rendered from that design system.
- `manifest.webmanifest` + the root icons make the site installable; pages carry full PWA/OG/Twitter meta blocks — keep those consistent when adding a page.

## Content conventions

- Language is `en-AU`; dates and events are real campaign facts — don't invent or change dates, distances, or route details without instruction.
- Page `<title>`s follow the pattern `Love in Motion — <Name>`.

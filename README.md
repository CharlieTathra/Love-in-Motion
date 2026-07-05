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
| **Fuel** | https://charlietathra.github.io/Love-in-Motion/nutrition-meal-planner/ | Daily fuelling protocol — meals with measured serves and macros, snacks, on-run fuel and recovery, across Plan A/B/C |
| **Train** | https://charlietathra.github.io/Love-in-Motion/training/ | Phase-by-phase build to 60 km — Base / Build / Peak / Taper — with week tabs, prescribed strength workouts and saved training notes |
| **The 415** | https://charlietathra.github.io/Love-in-Motion/the-415/ | The Attunga → Sydney campaign — multi-day training, on-the-road fuelling, crew and recovery for the 415 km |
| **Donate** | https://charlietathra.github.io/Love-in-Motion/donate/ | The fundraiser, in support of the McGrath Foundation |

## How it works

- Five standalone `index.html` files (home, `nutrition-meal-planner/`,
  `training/`, `the-415/`, `donate/`).
- No build step — each file works opened directly in a browser and offline.
- Progress (meals eaten, sessions done) and training notes are saved in the
  browser, with an in-memory fallback when storage is unavailable. The Plan
  A/B/C choice is shared between the Fuel and Train apps.
- Deployed to GitHub Pages automatically on every push to `main`
  (`.github/workflows/deploy-pages.yml`).

## Supabase sync (optional)

The apps now support optional Supabase-backed sync while keeping the existing
local/offline behaviour.

> ⚠️ This client-only integration has no user authentication built in. Anyone who
> can inspect your page and obtain the scope value can read/write that scoped
> row. Use only for non-sensitive data, or add Supabase Auth / an Edge Function
> (recommended for rate limiting and stronger access control).

### 1) Create table in Supabase SQL editor

```sql
create table if not exists lim_app_state (
  scope text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
```

### 2) Add RLS policy for client writes

```sql
alter table lim_app_state enable row level security;

create policy "Allow read/write for one app scope"
on lim_app_state
for all
to anon
using (scope = 'REPLACE_WITH_LONG_RANDOM_SCOPE')
with check (scope = 'REPLACE_WITH_LONG_RANDOM_SCOPE');
```

> This pattern is for non-sensitive personal progress data only. The scope value
> is visible in client code, so anyone who can inspect your page and knows the
> scope can read/write that row. For stronger security, use Supabase Auth or an
> Edge Function proxy.

### 3) Provide config on each page (before `supabase-sync.js`)

```html
<script>
  window.LIM_SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
  window.LIM_SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
  window.LIM_SUPABASE_SCOPE = "REPLACE_WITH_LONG_RANDOM_SCOPE";
</script>
```

If these variables are not set, the site continues to use local browser storage
exactly as before.

`LIM_SUPABASE_SCOPE` is optional but recommended if you want the same data on
multiple devices/browsers. The default scope is per-device, so without this
value each browser stores independently.

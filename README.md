# CRIMEMAP — Geospatial Crime Intelligence, Analytics & Decision-Support System

Hackathon prototype. **All data is synthetic and seeded (no real people, cases, or victim details).**
A persistent "Prototype · Simulated Data" label appears in the header. No government emblems or
endorsement claims are used. Assumption: geography is approximate Puducherry-area bounds; blue markers
mean Theft (the source text was garbled); risk scores are an illustrative weighted sum, not a trained model.

## Prerequisites

- Node.js 18+ and npm

## Exact commands

```bash
npm install          # install dependencies
npm run generate:data  # regenerate synthetic data -> public/data/crimemap-data.json (seed 12345)
npm run dev          # start dev server (http://localhost:3000)
npm run build        # production build -> dist/
npm run preview      # serve the production build locally
```

The app runs with `npm install` + `npm run dev` and builds with zero errors.
On Windows you can also double-click `preview.bat` — it installs dependencies if needed,
builds, and serves the production site (open the Local URL it prints).
Sample data ships in `public/data/crimemap-data.json` (500 incidents, 8 stations, 20 patrol units,
10 landmarks over ~12 months), so the app works without regenerating.

## Project structure

```
├── index.html
├── public/
│   ├── favicon.svg
│   └── data/crimemap-data.json   # generated sample data (do not hand-edit)
├── scripts/generate-data.js      # seeded synthetic data generator
├── src/
│   ├── main.jsx                  # entry: router + CSS + Leaflet assets
│   ├── App.jsx                   # routes (8 pages) + providers
│   ├── styles/                   # tokens.css (design tokens) + global.css (Tailwind + base)
│   ├── services/                 # DataContext (service layer), DemoContext, AlertContext, RoleContext
│   ├── utils/geo.js              # haversine, hotspot scoring, patrol windows, CSV helpers
│   ├── components/               # Button, Card, Badge, Input/Select, Table, Modal/Drawer,
│   │                             # KPICard, Chart (ECharts), Layout, AlertsPanel, ExportMenu,
│   │                             # GuidedDemo, RoleSwitcher, DataState
│   └── pages/                    # Overview, Dashboard, CrimeMap, HotspotsRisk,
│                                 # TrendsTime, PatrolPlanner, Cases, SystemEthics
├── tailwind.config.js / postcss.config.js / vite.config.js
```

## 5-minute demo click-path (live script)

1. **Overview (0:00–0:40).** "Reports say '50 cases' — but a map shows 35 clustered around three
   streets between 7 and 10 PM." Click **Start Guided Demo**.
2. **Crime Map, steps 1–2 (0:40–2:00).** The map flies to Grand Bazaar: assault/theft markers
   cluster near the market 6:30–9:30 PM. Toggle the **heatmap** layer; open **Geospatial search**
   and run the preset **"2 km of railway station, last 6 months"** — the radius draws, a summary
   counts cases by type, and the equivalent PostGIS `ST_DWithin` query appears under Technical view.
3. **Hotspots & Risk, step 3 (2:00–3:00).** A red **Critical** ward hotspot. Drag the factor-weight
   sliders (severity, recurrence, time concentration…) and watch the ranking update live. Read the
   notice aloud: *"Simulated risk estimation — places and time periods, never individuals."*
4. **Dashboard, step 4 (3:00–3:40).** Weekend-evening alert in the Recent Alerts panel; KPIs
   (total, today, this week, most common type, hotspots, unresolved, response time, change %,
   highest-severity area, available units) are all computed from the data.
5. **Patrol Planner, step 5 (3:40–4:30).** Recommended deployment (2 units, Fri–Sat 18:00–22:00),
   nearest available units with simulated ETAs, and a dashed simulated route. Assign a unit
   (simulated) and export the plan CSV.
6. **Cases + close (4:30–5:00).** Search a case, open it, change status (in-memory). Switch the
   top-bar role to **Analyst** — victim/suspect fields mask instantly. Close: predictions guide
   presence; they never label people.

Exit the demo any time with **Exit Demo** in the header or the demo bar.

## Simulated vs real backend

| Simulated in prototype | Needs a real backend |
|---|---|
| All incidents, stations, units, landmarks (seeded JSON) | PostgreSQL/PostGIS with FIR/CAD/RMS ingestion |
| Hotspot scores + predictive risk (weighted sums) | Validated model trained on real history + bias tests |
| Response times, ETAs, routes, deployment suggestions | CAD/AVL integration, routing engine |
| Login roles, masking, status changes (in-memory) | JWT/OAuth2, RBAC, audit logs, case DB writes |
| Alerts (computed from sample thresholds) | Streaming pipeline + notification service |
| CSV export (works) / print-to-PDF (works via browser) | Server-side reports, scheduled digests |
| Map tiles need network; offline shows fallback notice | Tile caching / offline map pack for low connectivity |

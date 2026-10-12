# CRIMEMAP — Presentation Brief for AI Slide Generation

> Feed this file to Claude (or any slide generator) to produce a hackathon PPT.
> Target: 10 slides, 16:9, ~5-minute talk + 2-minute demo.

## Presentation meta

- **Title:** CRIMEMAP
- **Tagline:** MAP • ANALYSE • PLAN • PREVENT
- **Subtitle:** Geospatial Crime Intelligence, Analytics & Decision-Support System
- **Theme:** Police navy `#111C32`, police gold `#E8C21A`, crime red `#D71920`, clean white cards
- **Fonts:** Playfair Display for slide titles, Source Serif 4 for body (matches the website)
- **Disclaimer (put on title + closing slides):** "Hackathon prototype. All data is synthetic and simulated — no real people, cases, or victim details."

---

## Slide 1 — Title

- Big title: CRIMEMAP
- Tagline: MAP • ANALYSE • PLAN • PREVENT
- Subtitle: Geospatial Crime Intelligence, Analytics & Decision-Support System
- Small badges: "Hackathon Prototype" • "Simulated Data"
- Suggested visual: dark navy background, gold accents, police-crest motif, faint map grid

**Speaker note:** "Reports say 50 cases — but a map shows 35 clustered on three streets between 7 and 10 PM. That gap is why CRIMEMAP exists."

## Slide 2 — The Problem

- Crime data scattered across FIR registers, CAD, RMS, and manual logs
- Tables and manual charts hide geographic concentration
- Hotspots, time patterns, and repeat locations go undetected
- Deployment is reactive, not intelligence-led
- No unified view for station officers, district heads, and analysts

**Speaker note:** "Every existing input answers *how many*. None answers *where and when*."

## Slide 3 — The Solution

- One GIS platform: interactive maps + analytics + risk estimation
- Answers three questions: WHERE (hotspot wards), WHEN (evening 18:00–22:00 peak), WHAT (6 crime categories)
- Turns patterns into patrol plans with ETAs and routes
- Built-in 5-minute guided demo for live presentation

**Speaker note:** "CRIMEMAP converts scattered records into one map officers can act on."

## Slide 4 — Tech Stack

| Layer    | Technology                                                        |
| -------- | ----------------------------------------------------------------- |
| UI       | React 18, React Router 6, Vite 5                                  |
| Styling  | Tailwind CSS + custom design tokens                               |
| Maps     | Leaflet, marker clustering, heatmaps, OpenStreetMap tiles         |
| Charts   | Apache ECharts (line, bar, heatmap, pie)                          |
| Data     | Seeded synthetic JSON generator (seed 12345), no backend required |
| AI       | Browser-to-local-model (Ollama / LM Studio); nothing uploaded     |
| Hosting  | Vercel with SPA rewrites                                          |

**Speaker note:** "Runs with two commands — npm install, npm run dev. Zero backend to configure."

## Slide 5 — Data (100% Synthetic)

- 500 incidents · 8 police stations · 20 patrol units · 10 landmarks · ~12 months
- Geography: approximate Puducherry bounds (center 11.94, 79.80)
- 6 crime types: Assault, Theft, Traffic Violation, Cybercrime, Missing Person, Resolved
- Anchors: Grand Bazaar Market and Railway Station clusters
- Reproducible: `npm run generate:data` regenerates the identical dataset

**Speaker note:** "Every number on screen is generated from seed 12345. Nothing real, nothing sensitive."

## Slide 6 — Product Tour (9 Sections)

1. **Overview** — problem, solution, 3-step how-it-works, capabilities
2. **Dashboard** — 10 KPIs, incident trends, alerts, top areas
3. **Crime Map** — clustered markers, heatmap, hotspot zones, radius search with PostGIS preview
4. **Hotspots & Risk** — explainable 7-factor weighted scores with live sliders
5. **Trends & Time** — monthly/hourly/weekday charts, ward × time heatmap, patrol windows
6. **Patrol Planner** — live unit map, nearest units with simulated ETAs, deployment plan, CSV export
7. **Cases** — searchable case table, status workflow, role-masked details
8. **AI Assistance** — local AI analysis, next-crime prediction, officer Q&A
9. **System & Ethics** — architecture and safeguards

**Speaker note (live demo path):** Overview → Crime Map (Grand Bazaar fly-to + heatmap) → Hotspots (drag a slider) → Dashboard (weekend alert) → Patrol Planner (assign a unit) → Cases (switch role to Analyst, fields mask).

## Slide 6B — NEW Module 8: Environmental Safety & Vulnerability Heatmap (Safety Score & CPTED Engine)

- Shift: from reactive crime tracking to proactive environmental safety scoring
- Green Spots (Safe): high crowd / roaming density + strong lighting + visible CCTV
- Yellow / Amber Spots (Moderate): average footfall, moderate lighting, partial CCTV
- Red Spots (High-Vulnerability): isolated / low footfall + poor lighting + CCTV blind spots + historic density
- Formula: Safety Score = w1*(Footfall / Roaming Density) + w2*(CCTV Coverage) + w3*(Lighting & Openness) - w4*(Historical Incident Density)
- For Police: directs beat / mobile patrols to red zones at late-night hours
- For Citizens: routes commuters via green monitored corridors, not isolated alleys
- Privacy: aggregated ward / street-segment level only — zero identifying pins, survivor anonymity preserved
- Connects to: Patrol Planner (auto-prioritizes red zones) + AI Assistant (explains why an area is red + suggests fixes)

**Speaker note (30-40 sec pitch — say aloud):** "CrimeMap told you WHERE crime happened. Module 8 tells you WHERE it is unsafe right now — before a crime happens. We score every street on footfall, lighting, CCTV, minus past incidents. Green means active, lit, and monitored. Red means isolated, dark, and blind. Patrols go straight to the red zones at night, citizens stay on green corridors, and our AI explains exactly how to turn red to green. Proactive safety, not just reactive maps — with zero identifying pins."

## Slide 7 — Standout Features

- 5-minute guided in-app demo that flies across pages by itself
- Role switcher: Analyst sees masked victim/suspect fields; officer sees full (simulated RBAC)
- Alert engine: sharp increases, high severity, hotspot thresholds, patrol needs
- CSV export + print-to-PDF on every data view
- Fully mobile-responsive with offline map fallback

## Slide 8 — Ethics & Safeguards

- Predictions describe PLACES and TIME PERIODS — never individuals
- No profiling by caste, religion, income, or background
- Victim identities masked; data minimization in every view
- "Simulated — not evidence" labels on every prediction
- Bias testing and human-in-the-loop required before any real deployment

**Speaker note (say aloud):** "Predictions guide presence; they never label people."

## Slide 9 — Prototype vs Production

- **Today:** JSON data, weighted-sum scores, simulated ETAs/routes, in-memory roles
- **Production needs:** PostgreSQL/PostGIS, real FIR/CAD ingestion, trained and validated models, JWT auth with audit logs, CAD/AVL and routing integration

## Slide 10 — Team & Links

- Team: [TEAM NAME] · Institution: [INSTITUTION] · Hackathon: [HACKATHON NAME]
- Live site: [VERCEL URL] · Code: github.com/reptoscompany/Hackathon-2
- Run locally: `npm install` → `npm run dev` → http://localhost:3000
- Closing line: "Predictions guide presence; they never label people."

---

## Instructions to the slide-generating AI

1. Generate exactly 10 slides from the outline above, one section per slide.
2. Keep bullets to max 6 per slide, max 12 words per bullet.
3. Use the navy/gold/red theme and the serif title font pairing.
4. Put the synthetic-data disclaimer as a footer on every slide.
5. Add the speaker notes as presenter notes, not slide body text.
6. Replace [TEAM NAME], [INSTITUTION], [HACKATHON NAME], and [VERCEL URL] with placeholders if values are unknown.

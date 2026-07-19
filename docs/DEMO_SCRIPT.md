# Demo Script — 3 minutes

Target: hit every RUBRIC.md category on the deployed URL, phone-sized viewport. Rehearse twice; total ≈ 2:50 with buffer.

**Setup (before recording):** deployed URL open on a mobile viewport; `/ops` in a second tab (desktop); one incognito window ready to prove cold-start.

---

## 0:00 — Hook (15s)

> "July 2026. 58,000 fans, most of whom don't speak Spanish, are inside Estadio Aurora for the World Cup Final. This is MatchDay Copilot — a Gemini-powered steward in every fan's pocket."

Show the app loading: map, crowd banner, chat.

## 0:15 — Multilingual grounded navigation (45s) → *Functional GenAI 35% + Persona fit 30%*

1. Type: **"¿Cómo llego a mi asiento 214 desde la puerta A?"**
2. Narrate while it streams: "Gemini detects Spanish, calls the `getDirections` tool — a real Dijkstra route over the venue graph — and the answer streams back in Spanish while the route draws on the map. **The model cannot invent directions; tools are its only source.**"
3. Point at the numbered steps + the animated polyline + the "Route · 183 m" pill.

## 1:00 — Accessibility journey (30s) → *Persona fit + edge-case bonus*

1. Tap **♿** (point out: larger text, simple-language mode).
2. Type: **"I use a wheelchair. Take me to seat 214."**
3. Narrate: "Same question, different path — the router drops stairs-only edges and reroutes via the northeast lift. Watch the map change." Point at the ♿ step-free pill.

## 1:30 — Crowd intelligence + getting home (30s) → *Functional GenAI + persona*

1. Type: **"Which exit will be least crowded after the final whistle?"**
2. Narrate: "A deterministic, seeded crowd simulation feeds `getCrowdLevel` — Gemini reasons over live zone data and recommends the quiet gate. Same data shades the map."
3. Tap chip **🚇 Getting home** → transport card with surge advice appears.

## 2:00 — The demo that cannot die (25s) → *Edge cases + code quality*

1. Switch to the incognito window pre-pointed at the degraded deployment (or narrate over a slide of it):
> "Kill the API key entirely — quota gone, network down — and the copilot still answers the core journeys in six languages with the same real routing. Judges: refresh anything, it won't break."
2. Point at the ⚡ demo-mode badge.

## 2:25 — Ops dashboard (25s) → *GenAI breadth (JSON mode)*

1. Desktop tab: `/ops`.
2. "Same simulation, organizer view: live heatmap, incident feed. One click — Gemini JSON mode with a response schema triages severity and dispatch role." Click **Triage** on the missing-child incident → critical/security.
3. Click **Broadcast in 6 languages** → show the six translations.

## 2:50 — Close (10s)

> "Next.js on Vercel, Gemini 2.5 Flash, four function-calling tools, JSON mode, and a prompt journal documenting every iteration — MatchDay Copilot. Gracias, merci, شكراً, धन्यवाद!"

---

## Rubric coverage checklist

| Rubric item | Demo beat |
| --- | --- |
| Functional GenAI (35%) | 0:15 tool-calling route, 1:30 crowd reasoning, 2:25 JSON mode |
| Persona fit (30%) | Spanish seat journey, wheelchair route, transport home |
| Code quality (20%) | Narrated grounding architecture; README/repo tour follow-up |
| Efficiency (15%) | Streaming first tokens on camera; flash model; instant map |
| Edge-case bonus | 2:00 degraded mode; mixed-language QA mention |
| Cloud bonus | "Next.js on Vercel + Gemini API" in close |

## Failure drills (rehearse these)

- **Gemini slow on camera** → keep talking through the stream; if >8s the app auto-falls back and the demo *still works* — narrate that as the feature it is.
- **Wrong language reply** (rare) → re-send from a chip; chips are pre-tested.
- **Projector kills colors** → crowd levels are also written in text in the banner and ops zone list.

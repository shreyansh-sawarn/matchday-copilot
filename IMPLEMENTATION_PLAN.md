# IMPLEMENTATION_PLAN — MatchDay Copilot

Owner: IMPLEMENTATION_ENGINE. Gates run by REVIEW_ENGINE (validate requirements → review implementation → identify defects → prioritize improvements → report). Budget: 1 dev, ~16–20H. Every phase ends in a deployable state. Feature IDs → hackos/context/FEATURES.md; decisions → DECISIONS.md.

---

## Phase 0 — Scaffold (1H) [F-01]

Tasks:
- `npx create-next-app` (TS, App Router, Tailwind) into `app/`-rooted repo layout per docs/ARCHITECTURE.md
- `lib/types.ts`: Zone, Poi, GraphNode, GraphEdge, RouteStep, CrowdLevel, TransportOption, ChatEvent types
- `app/layout.tsx`: mobile viewport meta, manifest.ts (name/icons/theme), base a11y landmarks
- `.env.example` with `GEMINI_API_KEY=`; pin `@google/genai` exact version
- Push to public GitHub repo; connect Vercel; first deploy (hello shell)

Acceptance criteria: repo public; Vercel URL renders shell on mobile viewport; typecheck passes.

Gate 0 (REVIEW_ENGINE): deploy pipeline proven end-to-end before any feature code. Fail → fix before Phase 1.

---

## Phase 1 — Data + Simulation (3H) [F-02, F-03]

Tasks:
- `data/venue.json`: ~8 zones (concourse N/E/S/W, upper level, pitch), 4 gates (A–D), ~25 POIs (food incl. halal/veg tags, restrooms, prayer room, medical, exits, info desk), seat sections (e.g., 101–130, 201–230), waypoint graph (~40 nodes, edges with distance + `accessible` flag; stairs vs lift/ramp pairs)
- `data/matches.json` (3 fixtures incl. "today"), `data/transport.json` (2 metro lines, 3 bus routes, 2 parking lots, post-match surge windows), `data/faqs.json` (~15 entries)
- `lib/venue.ts`: findPoi, nearestPoi(kind, fromNode, {accessible, tags}), route(from, to, {accessible}) — BFS/Dijkstra over graph; returns RouteStep[] + node polyline
- `lib/simulation.ts`: mulberry32-seeded `crowdAt(zoneId, t)`; base curve per zone + match-phase modifiers from matches.json; 10s time buckets (D-03: pure function)
- Unit tests (vitest, minimal): route() finds path, accessible filter avoids stairs-only edges, crowdAt deterministic for same bucket

Acceptance criteria: tests green; `route('gate-a','seat-214')` returns sensible steps; `crowdAt` identical across two process runs for same timestamp.

Gate 1: STAFF_ENGINEER checklist — typed accessors only (no raw JSON imports in components), graph connected (no unreachable POIs). Fail → fix data before UI exists to hide it.

---

## Phase 2 — Fan Chat (4.5H) [F-04, F-05, F-07, F-08]

Tasks:
- `lib/prompts.ts`: system prompt (steward persona, KB digest, grounding rules, "reply in user's language", never invent directions), accessibility variant (simple language), tool declarations getDirections/getCrowdLevel/getTransport with JSON schemas
- `lib/gemini.ts`: client init from env; streaming call; tool-loop (max 3 rounds); arg validation; 8s first-token timeout; 1 retry backoff; normalized errors
- `app/api/chat/route.ts`: SSE handler emitting `text` | `route` | `crowd` | `transport` | `done` | `degraded` events; Node runtime; `maxDuration=30`; per-IP soft cap
- `lib/fallback.ts`: keyword-intent resolver (directions/food/restroom/transport/help) → canned responses in 6 languages + direct `lib/venue.ts` routing; same SSE event shape
- `components/Chat.tsx` + `MessageBubble.tsx`: streaming render, RTL for Arabic, quick-suggestion chips ("Find my seat", "Nearest halal food", …)

Acceptance criteria: EN/ES/AR prompts stream correct grounded replies; "take me to gate C" triggers getDirections and answer contains tool steps; unset GEMINI_API_KEY locally → app still answers all chip intents with degraded badge; unknown question → graceful "not in my data" reply.

Gate 2 (critical): AI_ENGINEER checklist — no hallucinated gate/route facts in 10 scripted probes; tool loop never exceeds 3 rounds; fallback exercised. Fail → do NOT proceed to map; fix grounding first.

---

## Phase 3 — Map + Navigation (3H) [F-06]

Tasks:
- `components/StadiumMap.tsx`: inline SVG (timebox 1.5H authoring per R-07; fallback schematic allowed), zone shapes with ids matching venue.json, route polyline layer, animated "you are here → destination" highlight
- Wire `route` SSE events → map highlight + step list card in chat
- `GET /api/crowd` + `components/CrowdBanner.tsx`: zone shading by crowd level, advisory banner text sourced from chat getCrowdLevel calls
- Deploy + smoke test on phone-sized viewport

Acceptance criteria: "take me to my seat 214 from gate A" renders highlighted path + numbered steps; wheelchair query renders different (accessible) path; map matches data zones 1:1.

Gate 3 — FAN SURFACE REVIEW (the ops gate): full REVIEW_ENGINE pass — all FR-1..FR-8 demoable on deployed URL; 6-language scripted round; degraded-mode round; defects prioritized. PASS + ≥5H remaining → Phase 4 permitted. PASS with <5H → skip to Phase 5. FAIL → fix, re-gate.

---

## Phase 4 — Ops Dashboard (STRETCH, 4H) [F-12, F-13, F-14]

Only if Gate 3 passed with ≥5H spare (D-01). Order: heatmap → triage → briefing/announce; each sub-feature independently shippable, cut from the tail.

Tasks:
- `app/ops/page.tsx`: reuse StadiumMap with crowd-density fill from `/api/crowd`; auto-refresh 10s
- Simulated incident feed (seeded from simulation) + `app/api/ops/triage/route.ts`: JSON mode + responseSchema `{severity, suggestedAction, dispatchRole}`; validation + 1 re-ask + canned sample fallback
- `app/api/ops/briefing/route.ts` (sim state → briefing) and `app/api/ops/announce/route.ts` (`{lang: text}` for 6 languages); one-click buttons in UI

Acceptance criteria: heatmap visibly changes across time buckets; triage returns valid JSON for 5 sample incidents; announce outputs all 6 languages.

Gate 4: REVIEW_ENGINE — ops must not degrade fan surface (bundle, latency, shared code regressions). Any regression → revert ops commit(s).

---

## Phase 5 — Polish, Accessibility, i18n QA (2.5H) [F-09, F-10 finish]

Tasks:
- `components/AccessibilityToggle.tsx`: large-text class switch, simple-language flag → prompt variant, focus states, aria-live on streaming messages, alt/aria audit
- `components/TransportCard.tsx` + `GET /api/transport`: options list + "leave at HH:MM after final whistle" suggestion wired to chat tool
- Scripted QA matrix: 6 languages × (seat, halal food, wheelchair route, exit, transport) + 5 adversarial probes (out-of-venue, gibberish, mixed language, very long input, empty)
- Lighthouse pass (mobile): fix contrast, tap targets, obvious perf issues (defer map paint, no layout shift)
- Log all findings in NOTES.md → fix Highs

Acceptance criteria: QA matrix passes (no hallucinated facts, correct language every reply); screen reader announces streamed messages; Lighthouse a11y ≥ 95, perf ≥ 85 mobile.

Gate 5: QA-style REVIEW_ENGINE pass; any Critical → fix before Phase 6.

---

## Phase 6 — Deploy, README, Demo Assets (2H) [F-11]

Tasks:
- Final Vercel deploy; verify with `GEMINI_API_KEY` removed (degraded) then restored
- README.md: problem → persona, architecture diagram, prompt-engineering section (excerpts from lib/prompts.ts + grounding rules), function-calling design, degraded mode, setup, simulated-data disclosure
- Demo script (90s walkthrough) + screenshots/GIF for README and LinkedIn
- LinkedIn post draft tagging Hack2skill + Google for Developers, with deployed link + repo
- Update hackos/context/STATE.md → Submission Ready

Acceptance criteria: fresh clone + `npm i` + `.env` → runs; fresh incognito visit to deployed URL completes the 90s demo script; README explains every rubric category's evidence.

Gate 6 — JUDGE_ENGINE simulation: score against RUBRIC.md; only High-ROI fixes actioned; then submit. F-16 multimodal permitted here only if ≥3H remain post-gate (D-12).

---

## Timeboxes Summary

| Phase | Budget | Cumulative |
| ----- | -----: | ---------: |
| 0 Scaffold | 1H | 1H |
| 1 Data+Sim | 3H | 4H |
| 2 Fan Chat | 4.5H | 8.5H |
| 3 Map+Nav | 3H | 11.5H |
| 4 Ops (stretch) | 4H | 15.5H |
| 5 Polish/a11y | 2.5H | 18H |
| 6 Ship | 2H | 20H |

Overrun rule (R-02/R-06): cut Phase 4 first, then F-16; never cut degraded mode, accessibility, or the Phase 6 checklist. Update STATE.md after every working session.

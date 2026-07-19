# Feature Backlog

Scored by PRODUCT_MANAGER + SCORING_ENGINE against RUBRIC.md under constraint: ONE developer, ~TWO days.
ROI = (rubric value × judge visibility) / effort. Effort in developer-hours (H). Budget ≈ 16–20 productive hours.

---

## Feature Backlog

| ID | Feature | Category | Priority | ROI | Judge Visibility | Effort | Risk | Status |
| -- | ------- | -------- | -------- | --- | ---------------- | ------ | ---- | ------ |
| F-01 | Next.js scaffold + Tailwind + mobile-first shell | Foundation | Must | — (enabler) | Low | 1H | Low | Approved |
| F-02 | Venue knowledge base (static JSON: zones, gates, POIs, seat sections, routing graph) + match schedule + FAQs + transport data | Foundation | Must | — (enabler) | Low | 2H | Low | Approved |
| F-03 | Deterministic crowd simulation (seeded, pure function of time) | Foundation | Must | Medium | Medium | 1.5H | Low | Approved |
| F-04 | Multilingual streaming Gemini chat, auto language detect (EN/ES/FR/AR/PT/HI), grounded on venue KB | Fan/AI | Must | Very High | Very High | 4H | Medium | Approved |
| F-05 | Function calling: getDirections, getCrowdLevel, getTransport | Fan/AI | Must | Very High | Very High | 2.5H | Medium | Approved |
| F-06 | SVG stadium map + step-by-step route rendering | Fan/UX | Must | Very High | Very High | 3H | Medium | Approved |
| F-07 | Crowd advisories in chat (sim data → Gemini reasoning: "Gate B congested, use Gate D") | Fan/AI | Must | High | High | 1H (rides on F-03/F-05) | Low | Approved |
| F-08 | Degraded mode: canned responses + non-AI routing when key missing/erroring | Reliability | Must | High | High (demo survival + edge-case bonus) | 1.5H | Low | Approved |
| F-09 | Accessibility mode: large text, simple language, ARIA/screen-reader markup, wheelchair routing | Fan/UX | Must | High | High | 2H | Low | Approved |
| F-10 | Transport planner: metro/bus/parking + post-final-whistle departure suggestion | Fan | Must | Medium-High | Medium | 1.5H (rides on F-05) | Low | Approved |
| F-11 | Vercel deploy + README (prompt-engineering docs) + demo script | Submission | Must | High (submission requirement) | Very High | 2H | Low | Approved |
| F-12 | Ops heatmap over SVG map from simulation | Ops | Should | Medium | Medium | 2H | Low | Deferred until fan review gate passes |
| F-13 | Incident feed + Gemini JSON-mode triage | Ops/AI | Should | Medium | Medium | 2H | Medium | Deferred until fan review gate passes |
| F-14 | Shift briefing + multilingual PA/push generator (JSON mode) | Ops/AI | Should | Medium | Medium | 1.5H | Low | Deferred until fan review gate passes |
| F-15 | Sustainability panel + AI recommendations | Ops | Cut | Low | Low | 2H | Low | Rejected |
| F-16 | Multimodal ticket photo → seat directions | Fan/AI | Cut* | Medium | High wow-factor | 2.5H | High | Deferred (*only if all Musts polished with ≥3H spare) |
| F-17 | Full PWA offline/install (service worker) | Fan | Cut | Low | Low | 2H | Medium | Rejected (manifest + mobile meta only, ~15 min) |
| F-18 | Voice input/output | Fan | Cut | Low | Medium | 3H | High | Rejected |
| F-19 | Real venue/transit API integrations | Data | Cut | Low | Low | 4H+ | High | Rejected (simulation decided, D-02) |

Must total: ~22H nominal → trimmed to fit by sharing infrastructure (F-07/F-10 ride on F-05; F-03 is small). Fan surface is one coherent build path.

---

## MVP Features

| Feature | Reason | Status |
| ------- | ------ | ------ |
| F-01..F-08, F-11 | Minimum demoable loop: lost non-local fan asks in own language → grounded answer → route on map → advisory → deployed | Approved |
| F-09, F-10 | Complete the persona story (accessibility + getting home); required by problem spec | Approved |

---

## High ROI Features

| Feature | Expected Score Gain | Estimated Time | Status |
| ------- | ------------------- | -------------- | ------ |
| F-04 chat | Anchors 35% GenAI category | 4H | Approved |
| F-05 function calling | Proves "functional AI, not decoration" | 2.5H | Approved |
| F-06 map routing | Most visible persona-fit proof | 3H | Approved |
| F-08 degraded mode | Insurance on entire demo + edge-case bonus | 1.5H | Approved |

---

## Stretch Goals

| Feature | Estimated Time | Business Value | Status |
| ------- | -------------- | -------------- | ------ |
| F-12 ops heatmap | 2H | Shows operational intelligence breadth | Gated |
| F-13 incident triage | 2H | Second JSON-mode GenAI showcase | Gated |
| F-14 briefing/announcements | 1.5H | Cheap once F-13 exists | Gated |
| F-16 ticket photo | 2.5H | Multimodal wow | Gated (last) |

Gate: fan surface passes REVIEW_ENGINE checklist (see IMPLEMENTATION_PLAN.md Phase 3 gate) first.

---

## Deferred Features

| Feature | Reason | Reconsider When |
| ------- | ------ | --------------- |
| F-12/F-13/F-14 ops surface | Judges prefer one persona deep; fan surface first | Fan review gate passed with ≥5H remaining |
| F-16 multimodal | High effort/risk vs. bonus value | All Musts polished, ≥3H remaining |

---

## Rejected Features

| Feature | Reason | Time Saved |
| ------- | ------ | ---------- |
| F-15 sustainability panel | Lowest judge visibility of ops widgets | 2H |
| F-17 full PWA offline | Judges test online; manifest gives the mobile feel | 2H |
| F-18 voice | Browser speech APIs flaky in demos; chat already multilingual | 3H |
| F-19 real APIs | No datasets provided; simulation is deterministic and demo-safe | 4H+ |

---

## Dependencies

| Feature | Depends On |
| ------- | ---------- |
| F-04 | F-01, F-02 |
| F-05 | F-02, F-03, F-04 |
| F-06 | F-02 (routing graph) |
| F-07 | F-03, F-05 |
| F-08 | F-04, F-05 |
| F-09 | F-04, F-06 |
| F-10 | F-02, F-05 |
| F-12..F-14 | F-03, fan review gate |
| F-16 | F-04, F-06 |

---

## Current Highest Priority

- Feature: F-01 scaffold (then F-02 data layer)
- Reason: Everything depends on it; unblocks parallel prompt drafting
- Estimated Completion: Hour 1 of build

---

## Notes

PM bias check: every Must maps to the fan persona's core sentence — "doesn't speak the local language and can't find their way around." Anything not serving that sentence is gated or cut.

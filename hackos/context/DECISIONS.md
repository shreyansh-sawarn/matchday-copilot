# Decision Log

Every significant decision recorded here. Owner: DECISION_ENGINE.

---

| ID | Decision | Status | Reason | Confidence | Timestamp |
| -- | -------- | ------ | ------ | ---------- | --------- |
| D-01 | Fan is the sole primary persona; ops surface strictly gated behind fan review gate | Accepted | Jury explicitly prefers one persona solved deeply; 30% rubric weight on persona fit | High | 2026-07-19 |
| D-02 | Simulate all venue/crowd/transport data (static JSON + deterministic sim); no real APIs | Accepted | No datasets provided; real APIs add hours + demo fragility for zero rubric value | High | 2026-07-19 |
| D-03 | Simulation is a pure function of (seed, wall-clock time bucket) — no server state | Accepted | Vercel serverless has no shared memory; pure function keeps all instances + ops/fan views consistent and judging reproducible | High | 2026-07-19 |
| D-04 | Model: `gemini-2.5-flash` only (no pro-class model, no model switching) | Accepted | Jury values prompt craft over advanced models; flash = speed (efficiency category) + quota headroom | High | 2026-07-19 |
| D-05 | Raw SSE + hand-rolled function-calling loop via `@google/genai`; no Vercel AI SDK | Accepted | Need custom SSE events (route/crowd payloads for map) and explicit fallback control; SDK abstraction hides the tool loop we want to showcase as craft | Medium-High | 2026-07-19 |
| D-06 | Hand-authored inline SVG stadium + waypoint graph; BFS routing with `accessible` edge filter | Accepted | Zero API keys, deterministic, wheelchair routing = same algorithm with edge filter | High | 2026-07-19 |
| D-07 | Language handling: Gemini auto-detects and replies in user's language; UI chrome from a tiny 6-language dictionary; no i18n framework | Accepted | Chat is the product; next-intl et al. cost hours for static strings judges barely see | High | 2026-07-19 |
| D-08 | Degraded mode is a Must-priority feature, not an afterthought (keyword-intent resolver + non-AI routing) | Accepted | Deployed demo must never hard-fail; doubles as edge-case-handling bonus signal | High | 2026-07-19 |
| D-09 | All prompts/tool schemas live in `lib/prompts.ts` as documented exported constants | Accepted | Makes prompt-engineering craft visible to code-reviewing judges | High | 2026-07-19 |
| D-10 | Node runtime (not edge) for API routes, `maxDuration=30` on chat | Accepted | Full SDK compatibility; streaming works fine on Node; avoids edge-runtime debugging | Medium | 2026-07-19 |
| D-11 | Cut: sustainability panel, full PWA offline, voice, real APIs (F-15/17/18/19) | Accepted | Low ROI vs. 2-day budget; see FEATURES.md Rejected table | High | 2026-07-19 |
| D-12 | Multimodal ticket-photo (F-16) deferred to last, behind polish | Accepted | High wow but high risk; only after all Musts pass review with ≥3H spare | High | 2026-07-19 |
| D-13 | Added a 4th tool `findNearest(kind, tags, from, accessible)` beyond the planned 3 | Accepted | "Nearest halal food" has no clean home in getDirections; magic-string args ("nearest:food:halal") are where flash models fumble — one tool per question shape | High | 2026-07-19 |
| D-14 | Fallback language detection checks Portuguese-distinctive words BEFORE Spanish | Accepted | QA matrix caught PT→ES misdetection via shared word "está"; ordering by distinctive vocabulary fixed 2/35 failures | High | 2026-07-19 |
| D-15 | Builds/tests run in a VM-local workdir synced from the repo; commits via local clone + ref update | Accepted | Mounted repo FS blocked mid-session file deletion (stale git locks); repo stays source of truth, build env stays fast | High | 2026-07-19 |
| D-16 | Seat-less "my seat" queries get a canned ask-for-section reply (askSeat intent) in all 6 languages | Accepted | Judge-simulation found the first demo chip failed in degraded mode without a seat number — worst possible first impression, fixed in <30 min | High | 2026-07-19 |

---

## Accepted Decisions

| Decision | Expected Benefit | Trade-offs |
| -------- | ---------------- | ---------- |
| D-01 fan-only depth | Max persona-fit score | No ops breadth unless time remains |
| D-02/D-03 simulated + pure sim | Reproducible, serverless-safe, zero infra | "Simulated" caveat in README |
| D-04 flash model | Fast streams, quota safety | Weaker on exotic queries; mitigated by grounding |
| D-05 raw SSE | Custom map events, visible tool loop | ~1h extra plumbing |
| D-06 SVG graph map | Real routing UX incl. wheelchair | Fictional layout must be authored (~1.5h) |
| D-08 degraded mode | Demo cannot die | 1.5h spent on non-happy-path |

---

## Deferred Decisions

| Decision | Reason | Review Trigger |
| -------- | ------ | -------------- |
| Build ops surface (F-12..14) | Gated on fan quality | Fan review gate passed, ≥5H remaining |
| Multimodal ticket scan (F-16) | Risk/effort | All Musts polished, ≥3H remaining |
| Response caching layer for repeated demo queries | May be unnecessary at flash speeds | If judging-day latency or 429s observed |

---

## Rejected Decisions

| Decision | Reason | Time Saved | Expected Score Impact |
| -------- | ------ | ---------- | --------------------- |
| Vercel AI SDK / LangChain | Abstraction hides showcased tool loop; dependency weight | ~0 (net) | Neutral; craft visibility better without |
| Mapbox/Google Maps for stadium | Wrong tool for indoor SVG venue; API keys + quota risk | 2H | Negative avoided |
| next-intl full i18n | Chat handles languages; static strings trivial | 2H | ~0 |
| Real-time WebSocket crowd feed | Serverless-hostile; polling GET /api/crowd every 10s is indistinguishable in demo | 3H | ~0 |
| Separate ops app/repo | One repo = simpler submission + shared sim | 1H+ | ~0 |

---

## Assumptions Accepted

| Assumption | Reason | Confidence |
| ---------- | ------ | ---------- |
| Judges will test the deployed link on mobile or narrow viewport | Fan surface pitched as mobile-first PWA | Medium-High |
| Gemini free tier suffices for judging traffic with flash + fallback | Low expected QPS | Medium-High |
| Fictional stadium acceptable | Challenge scores the GenAI experience, not GIS data | High |

---

## Architecture Decisions

| Decision | Reason | Impact |
| -------- | ------ | ------ |
| Single Next.js app, App Router | One deploy, one repo, API co-located | Whole build |
| No database | Nothing needs persistence in a 2-day demo | Removes infra risk class |
| Typed data layer (`lib/types.ts` + accessors) | Code-quality rubric category | All modules |

---

## AI Decisions

| Decision | Reason | Impact |
| -------- | ------ | ------ |
| Function calling as the only source of directions/crowd/transport facts | Prevents hallucinated navigation — the fatal demo failure | Chat correctness |
| KB digest in system prompt (<~1.5k tokens), detail behind tools | Latency + cost + grounding quality | Efficiency category |
| JSON mode + responseSchema for all ops outputs | Structured, validatable, showcases second Gemini capability | Ops stretch |
| Accessibility flag switches to simple-language system prompt variant | Persona depth + a11y rubric signal | Chat |

---

## Technology Decisions

| Technology | Reason | Alternatives Rejected |
| ---------- | ------ | --------------------- |
| Next.js 15 + TS | Vercel-native, co-located API | Vite+Express (2 deploys), SvelteKit (familiarity) |
| Tailwind | Speed | CSS modules, MUI (weight) |
| @google/genai | Official SDK, streaming + tools + JSON mode | REST hand-rolled (error-prone), AI SDK (D-05) |
| Vercel | Free, fast, cloud bonus signal | Netlify, Cloud Run (setup time) |

---

## Lessons Learned

| Observation | Recommendation |
| ----------- | -------------- |
| (populate during build) | |

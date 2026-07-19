# Risk Log

Severity scale: Very Low · Low · Moderate · High · Critical

---

## Active Risks

| ID | Risk | Category | Probability | Impact | Severity | Owner | Status |
| -- | ---- | -------- | ----------- | ------ | -------- | ----- | ------ |
| R-01 | Gemini rate limits / quota exhaustion during judging | External/AI | Medium | High | High | Dev | Mitigating |
| R-02 | Scope creep (ops surface, multimodal) starves fan-surface polish | Time | High | High | High | Dev | Mitigating |
| R-03 | Demo fragility: deployed link broken when judge opens it | Demo | Medium | Critical | Critical | Dev | Mitigating |
| R-04 | Multilingual quality poor in AR/HI (RTL, script, tone) | AI | Medium | Medium | Moderate | Dev | Mitigating |
| R-05 | Function-calling loop bugs (infinite loops, bad args) burn build hours | Technical | Medium | Medium | Moderate | Dev | Open |
| R-06 | Solo dev, 2 days: illness/interruptions shrink budget | Time | Low | High | Moderate | Dev | Accepted |
| R-07 | SVG map authoring takes longer than 1.5H | Technical | Medium | Medium | Moderate | Dev | Open |
| R-08 | Hallucinated directions despite grounding (fatal credibility hit in demo) | AI | Low-Med | High | High | Dev | Mitigating |

---

## Technical Risks

| Risk | Mitigation | Status |
| ---- | ---------- | ------ |
| R-05 tool-loop bugs | Cap loop at 3 tool rounds; validate args before execution; log every round in dev | Planned |
| R-07 SVG overrun | Timebox 1.5H; fallback = simpler schematic (concourse ring + radial sections), still supports routing graph | Planned |
| Serverless state assumptions | D-03: sim pure function of time; no module-state reliance for correctness | Resolved by design |

---

## AI Risks

| Risk | Mitigation | Status |
| ---- | ---------- | ------ |
| R-01 rate limits | flash model; 1-retry backoff; per-IP soft cap; degraded mode (R-03) as final backstop; keep a second API key ready to swap in Vercel env | Planned |
| R-04 multilingual quality | Explicit system-prompt directive ("reply in user's language, register: helpful steward"); 6-language scripted test pass in Phase 5; `dir="rtl"` rendering for AR | Planned |
| R-08 hallucinated navigation | Directions ONLY from getDirections tool results; prompt forbids inventing gates/routes; unknown → "ask the info desk" | Planned |
| JSON-mode output malformed (ops) | responseSchema + parse validation + 1 re-ask + canned sample | Planned |

---

## Demo Risks

| Risk | Mitigation | Status |
| ---- | ---------- | ------ |
| R-03 deployed link fails | Degraded mode (F-08) makes app fully usable with zero env vars; post-deploy smoke test with key removed; Phase 6 checklist re-test | Planned |
| Judge asks something off-script | Grounding rules + graceful "not in my data" behavior; fallback generic replies in 6 languages | Planned |
| Cold start latency on first judge visit | Node runtime small bundle; skeleton UI renders instantly while chat warms | Planned |

---

## Time Risks

| Risk | Mitigation | Status |
| ---- | ---------- | ------ |
| R-02 scope creep | FEATURES.md Must-list frozen; ops + multimodal behind explicit review gates with hour thresholds (≥5H / ≥3H spare) | Active |
| R-06 solo-dev shocks | Phases ordered so app is demoable from Phase 3 onward; every phase ends deployable | Active |
| Phase overrun | Each phase timeboxed in IMPLEMENTATION_PLAN.md; overrun → cut from tail (ops first), never from degraded mode or a11y | Active |

---

## Dependency Risks

| Dependency | Risk | Backup Plan |
| ---------- | ---- | ----------- |
| Gemini API | Outage during judging | Degraded mode; note in README that demo-mode toggle exists |
| Vercel | Deploy/platform failure | Redeploy; last resort: local `next start` + tunnel for live demo video |
| @google/genai SDK | Breaking version quirks | Pin exact version in package.json |

---

## Accepted Risks

| Risk | Reason | Owner |
| ---- | ------ | ----- |
| Fictional stadium layout | Challenge scores GenAI experience, not GIS accuracy; documented in README | Dev |
| No automated test suite beyond critical-path (routing + fallback + sim determinism) | 2-day budget; manual scripted QA in Phase 5 | Dev |
| Per-IP rate cap is best-effort (module scope) | Serverless makes it approximate; acceptable for demo | Dev |

---

## Resolved Risks

| Risk | Resolution | Date |
| ---- | ---------- | ---- |
| Serverless in-memory sim state | D-03 pure-function design | 2026-07-19 |

---

## Escalation Criteria

- Immediate Action Required: deployed link down; hallucinated directions observed in scripted QA
- High Priority: any Must feature slips its phase timebox by >50%
- Monitor: Gemini latency, AR/HI response quality
- Accept: fictional venue, approximate rate cap

---

## Contingency Plans

- Primary: full fan surface + at least one ops widget, deployed
- Secondary: fan surface only, fully polished
- Fallback: fan surface with degraded-mode-quality chat (canned) + working map routing
- Worst Case: recorded demo video + repo, with degraded live link

---

## Notes

Review this log at every phase gate (REVIEW_ENGINE consumes RISKS.md).

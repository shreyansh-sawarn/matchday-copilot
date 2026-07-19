# Hackathon Problem Statement

Single source of truth for the hackathon problem statement. Factual information from organizers only.

---

## Status

Analyzed

---

## Challenge Information

- Hackathon: Hack2skill x Google for Developers — PromptWars Virtual
- Challenge: #4 — "Smart Stadiums & Tournament Operations"
- Date captured: 2026-07-19
- Team: Solo (Shreyansh)
- Submission Deadline: TBD by organizers (working assumption: ~2 days of build time available)
- Remaining Time: ~2 developer-days

---

## Official Problem Statement

> Build a GenAI-enabled solution enhancing stadium operations and tournament experience for fans, organizers, volunteers, or venue staff during FIFA World Cup 2026, using Generative AI for navigation, crowd management, accessibility, transportation, sustainability, multilingual assistance, operational intelligence, or real-time decision support.

Submission requirements:

1. Public GitHub repository.
2. Working deployed link.
3. LinkedIn post tagging Hack2skill and Google for Developers.

---

## Official Resources

- Documentation: Google Gemini API docs (implied by Google for Developers sponsorship)
- Datasets: None provided — venue data must be simulated
- APIs: Gemini API
- SDKs: Google GenAI SDK
- Starter Code: None
- Reference Material: Official explainer session (source of confirmed judging criteria — see RUBRIC.md)

---

## Objectives

1. Enhance the tournament experience for a chosen persona during FIFA World Cup 2026.
2. Use Generative AI functionally (working features, not decoration).
3. Cover one or more of: navigation, crowd management, accessibility, transportation, sustainability, multilingual assistance, operational intelligence, real-time decision support.
4. Ship a working deployed application with a public repo.

### Chosen Persona (product decision, see DECISIONS.md D-01)

PRIMARY: the FAN — specifically, a fan inside a 2026 World Cup stadium who doesn't speak the local language and can't find their way around. Ops surface is a stretch goal only.

---

## Functional Requirements

| ID | Description | Priority | Source |
| -- | ----------- | -------- | ------ |
| FR-1 | Multilingual streaming chat (Gemini), auto-detect language; EN, ES, FR, AR, PT, HI | Must | Product spec |
| FR-2 | Chat grounded on venue knowledge base: zones, gates, seats, food, restrooms, prayer rooms, medical, exits; match schedule; FAQs; transport | Must | Product spec |
| FR-3 | Navigation intents → step-by-step directions rendered on SVG stadium map (gate / seat / nearest halal food / wheelchair-accessible route) | Must | Product spec |
| FR-4 | Accessibility mode: larger text, simple-language responses, screen-reader-friendly markup, wheelchair routing | Must | Product spec |
| FR-5 | Live crowd advisories from simulation layer (e.g., "Gate B congested, use Gate D") | Must | Product spec |
| FR-6 | Transport planner: metro/bus/parking guidance, post-match departure-time suggestion | Must | Product spec |
| FR-7 | Gemini function calling for structured venue queries: getDirections, getCrowdLevel, getTransport | Must | Product spec |
| FR-8 | Graceful degraded mode with canned responses if API key missing/failing — deployed demo never hard-fails | Must | Product spec |
| FR-9 | Ops dashboard (/ops): crowd heatmap, incident triage (Gemini JSON mode), shift briefing, multilingual PA/push generator, sustainability panel | Stretch | Product spec |
| FR-10 | Multimodal: photo of ticket → seat directions | Stretch | Product spec |

---

## Non-Functional Requirements

- Performance: fast first response; streaming chat; judged on efficiency/performance
- Scalability: not judged — single simulated venue is sufficient
- Availability: deployed link must work whenever judges open it
- Security: Gemini API key server-side via environment variable only
- Accessibility: dedicated accessibility mode; screen-reader-friendly markup
- Deployment: public working URL (Vercel), public GitHub repo
- Other: mobile-first PWA presentation for fan surface

---

## Constraints

- Time: ONE developer, roughly TWO days of build time
- Technology: Generative AI required; Gemini strongly implied by sponsor
- API Limits: Gemini free-tier rate limits apply during judging
- Submission Rules: public repo + deployed link + LinkedIn post (tag Hack2skill, Google for Developers)
- Platform Restrictions: none stated
- Internet Restrictions: none stated
- Licensing: public repo — use permissively licensed dependencies
- Hardware: none

---

## Expected Deliverables

- Application: Next.js app — fan surface (/) and stretch ops surface (/ops)
- Demo: working deployed link
- Repository: public GitHub repo with README
- Documentation: README covering setup, architecture, degraded mode
- Other: LinkedIn post

---

## Judging Information

Official Rubric Available: Yes (confirmed in official explainer session) — see RUBRIC.md

---

## Explicit Assumptions

| Assumption | Reason | Confidence | Impact |
| ---------- | ------ | ---------- | ------ |
| Venue data may be simulated (static JSON + deterministic simulation) | No datasets provided; challenge is about the GenAI experience | High | Enables entire data layer |
| ~2 days build budget | Stated operating constraint | High | Drives all scoping |
| Judges will open the deployed link possibly without warning | Standard for virtual hackathons | High | Degraded mode is a Must |
| Gemini is the expected model provider | Google for Developers sponsorship | High | Model/SDK selection |

---

## Open Questions

- Exact submission deadline — confirm from organizer portal (does not change plan; scope is bounded by the 2-day budget).

---

## Dependencies

Referenced by: PLAYBOOK, SCORING_ENGINE, ORCHESTRATOR_ENGINE, ARCHITECTURE_ENGINE

---

## Completion Checklist

- [x] Problem understood
- [x] Requirements extracted
- [x] Constraints identified
- [x] Resources collected
- [x] Questions documented
- [x] Assumptions documented

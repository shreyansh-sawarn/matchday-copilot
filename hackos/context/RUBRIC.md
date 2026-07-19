# Judging Rubric

Status: Official (confirmed in the official explainer session)

---

## Overall Strategy

- Winning Objective: Deepest, most polished solve of ONE persona (the fan) with visibly working GenAI features
- Primary Judging Focus: Functional usage of Generative AI + fit to the chosen persona's problem
- Estimated Confidence: High (criteria confirmed; weights are our allocation)

---

## Official Rubric

Criteria are official; weights are our inferred allocation (organizers did not publish numeric weights).

| Category | Weight | Source |
| -------- | -----: | ------ |
| Functional usage of Generative AI (working AI features, not decoration) | 35% | Explainer session |
| Addresses the problem statement for the chosen persona | 30% | Explainer session |
| Code quality | 20% | Explainer session |
| Efficiency / performance | 15% | Explainer session |

Bonus signals (uplift within categories, per explainer): edge-case handling, performance optimization, use of cloud services.

Explicit jury guidance: reasoning and prompt-engineering craft are valued over using the most advanced models.

---

## Success Criteria

| Criterion | Description | Priority |
| --------- | ----------- | -------- |
| AI is load-bearing | Chat, function calling, and advisories only work because of Gemini — removable AI = decoration | Critical |
| Persona depth | A non-local-speaking fan can complete real journeys: find seat, food, exit, transport — in their language | Critical |
| Never hard-fails | Degraded mode means the deployed demo works even with no/exhausted API key | Critical |
| Prompt craft visible | System prompts, grounding, tool schemas, and JSON contracts are documented in repo | High |
| Fast + streaming | Streamed first token quickly; light payloads; flash-class model | High |
| Edge cases handled | Unknown intents, unsupported language, out-of-venue questions, API errors | High (bonus) |
| Cloud services | Vercel deployment + Gemini API | Medium (bonus) |

---

## Score Optimization

| Category | Current Score | Target Score | Gap |
| -------- | ------------: | -----------: | --: |
| Functional GenAI | 0 | 33/35 | Build chat + function calling + advisories |
| Persona fit | 0 | 28/30 | Fan journeys end-to-end incl. accessibility |
| Code quality | 0 | 17/20 | Typed, small modules, documented prompts |
| Efficiency | 0 | 13/15 | Streaming, caching, flash model, small bundle |

---

## Feature Mapping

| Feature | Improves Category | Estimated Score Gain |
| ------- | ----------------- | -------------------- |
| Multilingual streaming chat + function calling | Functional GenAI | Very High |
| SVG map navigation with step-by-step directions | Persona fit | Very High |
| Crowd advisories (sim + Gemini reasoning) | Functional GenAI + Persona fit | High |
| Accessibility mode + wheelchair routing | Persona fit + bonus edge cases | High |
| Degraded mode / canned fallbacks | Bonus edge cases + demo reliability | High |
| Transport planner | Persona fit | Medium |
| Ops dashboard (JSON mode outputs) | Functional GenAI breadth | Medium (stretch only) |
| Multimodal ticket photo | Functional GenAI | Low per hour (cut unless time remains) |

---

## Highest ROI Categories

| Category | Reason |
| -------- | ------ |
| Functional GenAI | Highest weight; chat + tools + grounding is one coherent build |
| Persona fit | Second-highest weight; judges explicitly prefer one persona solved deeply |

---

## Lowest ROI Categories

| Category | Reason |
| -------- | ------ |
| Efficiency micro-optimization | Diminishing returns past streaming + flash model + caching |
| Feature breadth (ops surface) | Explicitly less valued than persona depth |

---

## Judge Expectations

- Technical: clean typed codebase, sensible API design, no dead code
- Innovation: grounded venue copilot with real routing, not a thin GPT wrapper
- AI Usage: streaming, function calling, JSON mode, careful prompts — craft over model size
- User Experience: mobile-first, works in 6 languages, accessible
- Business Value: directly maps to FIFA 2026 multilingual-crowd reality
- Presentation: demo never breaks; README explains prompt engineering

---

## Tie-break Strategy

If another team builds a stadium chatbot: win on (1) real function-calling navigation rendered on a map, not just text; (2) accessibility mode as a first-class journey; (3) deterministic simulation making advisories reproducible in judging; (4) documented prompt engineering; (5) a demo that cannot hard-fail.

---

## Notes

Weights drive FEATURES.md scoring. Any rubric change from organizers → re-run SCORING_ENGINE.

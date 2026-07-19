# Prompt Journal — MatchDay Copilot

This hackathon judges **prompt-based development**. This journal is maintained live during the build (not reconstructed afterwards). For each phase: the key prompts used to drive the AI pair (Claude operating the HackOS framework in this repo), what the first attempt produced, how the prompt was refined, and why.

Format per entry: **Prompt → First result → Refinement → Why it worked.**

---

## Phase P — Planning (pre-build)

**Prompt:** "Act as ORCHESTRATOR_ENGINE. Read the Challenge 4 brief and produce PROBLEM.md, RUBRIC.md with inferred weights, and a Must/Should/Cut feature backlog for ONE developer with ~2 days."

- **First result:** A backlog with 19 features, most marked "Must" — classic hackathon over-scoping.
- **Refinement:** Added the hard constraint sentence "Every Must must map to the single fan-persona sentence: *doesn't speak the local language and can't find their way around*" and forced ROI scoring (rubric weight × judge visibility / effort).
- **Why it worked:** Anchoring prioritization to one persona sentence gave the model a rejection criterion, not just a ranking. 8 features moved to Cut/Deferred (~11H saved) — recorded in FEATURES.md and DECISIONS.md (D-01, D-11).

**Prompt (architecture):** "Design for Vercel serverless: no shared memory between requests. Crowd simulation must be reproducible for judges."

- **First result:** Proposed an in-memory crowd state ticker — would silently break across serverless instances.
- **Refinement:** "State is forbidden. Make crowd a pure function of (seed, wall-clock time bucket)." → produced the mulberry32 `crowdAt(zoneId, t)` design (D-03).
- **Why it worked:** Stating the platform's failure mode ("no shared memory") as a design axiom instead of asking for "a simulation" eliminated the whole bug class.

---

## Phase 0 — Scaffold

**Prompt:** "Scaffold Next.js 15 (App Router, TS, Tailwind) with lib/types.ts covering Zone, Poi, GraphNode, GraphEdge, RouteStep, CrowdLevel, TransportOption, ChatEvent. Mobile viewport + manifest. Pin @google/genai exact. Build must pass before any feature code."

- **First result:** Clean scaffold, but the first `npm install` attempt was run against a slow mounted filesystem and corrupted mid-install (ENOTEMPTY on caniuse-lite).
- **Refinement:** Moved installs/builds to a fast local workdir synced from the repo; kept the repo as source of truth. Also pinned `@google/genai@2.12.0` exactly (reproducible judging installs) while leaving framework deps as ranges.
- **Why it worked:** Separating "authoring environment" from "build environment" made every later build/test cycle fast and deterministic. Gate 0 (typecheck + production build) green.

**Design note:** `ChatEvent` was typed **before** any chat code exists — the SSE contract (`text | route | crowd | transport | degraded | done | error`) is the spine of Phases 2–3, so the map and the fallback path can't drift from the AI path.

---

## Phase 1 — Data + Simulation

**Prompt:** "Author venue.json: 8 zones, 4 gates, ~28 POIs (halal/veg tags, prayer room, medical), seat sections 101–130 / 201–230, and a ~37-node waypoint graph where stairs and lifts are separate edges with an `accessible` flag. Wheelchair routing must be the SAME algorithm with a filtered edge set, not a special case."

- **First result:** A graph where the lift path was *shorter* than the stairs path — so every route used the lift and the wheelchair demo was indistinguishable from the normal one.
- **Refinement:** "Tune edge distances so stairs (15+18 m) beat the lift detour (40+15 m) for walking users. The accessible filter must visibly change the path on the map." Also asked for a graph-integrity test: *every* POI reachable from *every* gate, in both normal and step-free mode.
- **Why it worked:** Making the demo contrast ("visibly different path") an explicit requirement turned a data-tuning subtlety into a testable acceptance criterion. All 15 unit tests passed first run.

**Prompt (simulation):** "crowdAt(zoneId, t) must tell a story: plaza surges at ingress, bowl fills during halves, concourses spike at half-time, egress floods gates. Deterministic per 10s bucket."

- **First result:** Uniform random noise — statistically fine, narratively dead.
- **Refinement:** Provided a phase table (quiet/ingress/first-half/half-time/second-half/egress) with hand-tuned per-zone base occupancy, plus seeded ±12% wobble. Tests assert the narrative ("seats > 0.6 during first half").
- **Why it worked:** Giving the model the dramaturgy (what a judge should *see*) instead of a statistics spec produced advisories worth demoing — "Gate B congested, use Gate D" now emerges from data.

---

*(Entries for later phases are appended as each phase completes.)*

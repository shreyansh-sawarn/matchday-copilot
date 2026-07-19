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

## Phase 2 — Fan Chat (Gemini + tools + fallback)

**Prompt (system prompt design):** "Write the steward system prompt. Constraint: every navigational fact must come from a tool; venue facts only from a <1.5k-token KB digest; unknown → say so + Information Desk. Reply in the user's language, always."

- **First result:** A prompt that *described* grounding ("be accurate, don't hallucinate") — vague virtue-signalling the model can ignore.
- **Refinement:** Rewrote rules as numbered prohibitions with named tools ("Directions… MUST come from getDirections… NEVER invent a route, gate, distance") and added rule 3: admit the data is simulated if asked. Added a single Spanish few-shot exchange showing tool-call-then-answer, because flash models copy demonstrated behavior far better than described behavior.
- **Why it worked:** Prohibitions + one worked example beats paragraphs of guidance. The few-shot is deliberately in Spanish — it simultaneously teaches tool use AND reply-in-user's-language.

**Prompt (tool schemas):** "Declare getDirections/findNearest/getCrowdLevel/getTransport with flat string/boolean args only."

- **First result:** The initial plan had 3 tools; 'nearest halal food' had no clean home (getDirections can't search by kind+tag).
- **Refinement:** Added a 4th tool `findNearest(kind, tags, from, accessible)` instead of overloading `to` with magic strings like "nearest:food:halal". Logged as D-13.
- **Why it worked:** One tool per question shape keeps flash's tool choice reliable; magic-string args are where flash models fumble.

**Prompt (degraded mode):** "The fallback resolver must emit the exact same SSE event shapes as the AI path, driven by the same lib/venue.ts routing."

- **First result:** Intent regexes misrouted "Which exit is least crowded?" to plain exit-routing (exit keyword matched before crowd keyword) — caught by the new fallback test suite, 1 failure out of 23.
- **Refinement:** Reordered intent precedence: crowd-awareness beats exit routing. Also localized POI kind names after the smoke test produced Spanglish ("El restroom más cercano").
- **Why it worked:** Testing canned answers like real features (23 unit tests, 6 languages) treats demo-survival as a first-class product, not an afterthought — it's also the rubric's edge-case bonus.

**Gate 2 note:** SSE verified end-to-end in degraded mode (seat route + Spanish restroom probes). The 10 scripted live-Gemini grounding probes require a GEMINI_API_KEY and are deferred to first deploy — logged in NOTES.md.

---

## Phase 3 — SVG Map + Navigation

**Prompt:** "Author the stadium as concentric ellipse bands whose geometry is COMPUTED from the same coordinates the routing graph uses. Concourse quadrants must be separately fillable for crowd shading. Timebox: 1.5h."

- **First result:** The obvious approach — hand-drawing static `<path>` data — would have blown the timebox and drifted from graph node coordinates (map showing a route walking through walls).
- **Refinement:** Asked for parametric helpers instead: `band(a1,b1,a2,b2,t1,t2)` and `ring(...)` that emit elliptical-arc path data at render time, with ring radii chosen to enclose the graph's node coordinates (e.g. upper-tier nodes at a=408 sit inside the 390–430 band).
- **Why it worked:** "The graph's SVG coordinates drive both the shapes and the polyline" makes map/data disagreement structurally impossible — the single-source-of-truth rule applied to pixels, not just facts.

**Wiring insight:** no new protocol was needed — the `route` SSE event defined in Phase 0's `ChatEvent` type just gets a second consumer (the map) next to the chat text. Crowd shading reuses `/api/crowd` polling at the simulation's native 10s bucket, so the map ticks in lockstep with what `getCrowdLevel` tells the model.

**Gate 3 verdict (REVIEW_ENGINE):** PASS — build green, 23 tests green, SSE→map data flow verified incl. Hindi wheelchair probe in degraded mode; live-Gemini probes still deferred pending an API key at deploy. ≥5H budget spare → Phase 4 (ops) permitted per D-01 gate.

---

## Phase 4 — Ops Dashboard (stretch)

**Prompt (triage):** "JSON mode + responseSchema for {severity, suggestedAction, dispatchRole}. Enums enforced twice: in the schema AND in server-side validation. One re-ask on invalid output, then a canned keyword-table triage."

- **First result:** A prompt that let the model pick any severity wording ("URGENT", "Sev-2") — parse-able but not machine-actionable.
- **Refinement:** Moved the taxonomy INTO the prompt as rules ("missing child, fire, weapons, crush ⇒ critical") and mirrored the same enums in `responseSchema`. The re-ask message quotes the validation failure back to the model.
- **Why it worked:** JSON mode guarantees syntax; only the prompt can guarantee *semantics*. Belt-and-braces validation means the control room never sees free-text severity.

**Prompt (briefing):** "Feed the model a digest of the LIVE sim state (phase, per-zone occupancy, open incidents) and forbid speculation beyond it."

- **Why it worked:** Same grounding philosophy as the fan chat — the briefing is impressive precisely because every line traces to simulated data a judge can verify on the heatmap next to it.

**Gate 4 verdict:** PASS — fan surface unaffected (first-load 110kB, shared chunks unchanged), all four ops endpoints verified incl. degraded fallbacks (canned triage correctly marks "child separated" as critical/security).

---

## Phase 5 — Polish, Accessibility, i18n QA

**Prompt:** "Build a scripted QA matrix: 6 languages × (seat, food/restroom, wheelchair, crowd-exit, transport) + 5 adversarial probes (out-of-venue, gibberish, mixed-language, 3k-char input, near-empty). Run it against the degraded endpoint — it must pass with ZERO AI."

- **First result:** 33/35. Two Portuguese probes answered in Spanish/English: "Qual saída está menos lotada?" tripped the shared word "está" (in the Spanish keyword list), and "Como volto para a cidade?" matched nothing.
- **Refinement:** Reordered detection to check Portuguese-distinctive vocabulary (saída, banheiro, volto, cidade) BEFORE Spanish, and widened the transport intent to city/airport phrasings in all six languages. Re-run: 35/35.
- **Why it worked:** Language detection by keyword overlap fails in order-dependent ways; testing per-language with native phrasings (not translations of one English sentence) is what surfaced it.

**Accessibility as a journey, not a checkbox:** the ♿ toggle changes three things at once — 120% base font, `accessible=true` default on every routing tool call, and a simple-language system-prompt variant (short sentences, one instruction per line). Same feature, three rubric signals (persona depth, a11y, prompt craft).

**Gate 5 verdict:** PASS — QA matrix 35/35, unit tests 23/23, manual a11y audit logged in NOTES.md. Lighthouse + live-model language review deferred to the deployed URL (no browser/key in build env).

---

## Phase 6 — Ship (README, demo assets)

**Prompt:** "Write the README for a code-reviewing judge: problem → persona → architecture (mermaid) → a table of Gemini capabilities each mapped to WHERE it lives in the repo and WHY it scores. Disclose the simulated data honestly."

- **First result:** A generic feature-list README — the kind every hackathon submission has.
- **Refinement:** Reframed every section as rubric evidence: the Gemini table's third column is literally "why it matters [to a judge]", the prompt-engineering section quotes `lib/prompts.ts` verbatim, and the disclosure section pre-empts the "is this real data?" question instead of hoping it isn't asked.
- **Why it worked:** A README is a scoring document, not documentation. The demo script got the same treatment — every beat annotated with the rubric category it targets, plus rehearsed failure drills.

**Meta-lesson of the whole build:** the highest-leverage prompts were never "build X". They were constraint sentences — "state is forbidden", "tools are the only source of directions", "the accessible route must be VISIBLY different on the map", "same SSE shape with zero AI". Each one eliminated an entire failure class before any code existed.

---

*Journal complete — 7 phases, maintained live during the build as required by the PromptWars judging criteria.*

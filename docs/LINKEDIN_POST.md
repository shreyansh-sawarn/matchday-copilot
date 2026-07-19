# LinkedIn Post — draft for publishing

---

🏟️ **What if every one of 58,000 World Cup fans had a steward in their pocket — who speaks their language?**

That question kept me up during @Hack2skill × @Google for Developers **PromptWars**, and 48 hours later I had an answer: **MatchDay Copilot**, my submission for the Smart Stadiums challenge.

**What I built** 👇
A mobile-first stadium copilot where a lost fan types in *any* language — Spanish, Arabic, Hindi, anything — and gets:
🗺️ turn-by-turn directions drawn live on an SVG stadium map
♿ step-free wheelchair routes (same router, stairs filtered out)
📊 "Gate B is congested, use Gate D" advice from a live crowd simulation
🚇 transport options timed around the post-match surge
🎛️ plus an ops dashboard: heatmap, AI incident triage, PA announcements in 6 languages

**How Gemini powers it** ⚡
Gemini 2.5 Flash does the thinking, but never the guessing: every route, crowd level and transport fact comes from **function calls** into a deterministic data layer (4 tools), streamed over SSE. The ops side uses **JSON mode with response schemas** so severity and dispatch roles are machine-actionable, not prose. And if the API key dies mid-demo? A canned multilingual resolver + the same real routing engine take over. The demo cannot hard-fail.

**My approach: prompt-based development** 📝
This hackathon judges how you *prompt*, so I kept a live journal of every iteration. My favorite before/afters:

1️⃣ *Grounding:* "Be accurate, don't hallucinate" → did nothing. Rewriting it as numbered prohibitions — "Directions MUST come from getDirections. NEVER invent a route, gate or distance" — plus ONE few-shot example (deliberately in Spanish, teaching tool-use AND reply-in-my-language at once) changed everything. **Models copy demonstrated behavior far better than described behavior.**

2️⃣ *Simulation:* asking for "a realistic crowd simulation" got me statistically-fine, narratively-dead noise. Feeding the model the *dramaturgy* instead — "plaza surges at ingress, concourses spike at half-time, gates flood at egress" — produced advisories worth demoing.

3️⃣ *JSON triage:* schema-valid JSON isn't enough; the model returned "URGENT" as a severity. Moving the taxonomy INTO the prompt ("missing child, fire, crush ⇒ critical") and mirroring enums in the responseSchema made outputs machine-actionable. **JSON mode guarantees syntax; only the prompt guarantees semantics.**

Full journal (with what failed first) is in the repo.

**Stack:** Next.js 15 · TypeScript · Tailwind · @google/genai · Vercel
**Live demo:** <DEPLOYED_URL_PLACEHOLDER>
**Repo (prompt journal inside):** <REPO_URL_PLACEHOLDER>

Massive thanks to @Hack2skill and @Google for Developers for the push to build in public. Try it in your mother tongue and tell me where it breaks 👇

#PromptWars #FIFAWorldCup2026 #GeminiAPI #BuildWithAI #NextJS #Vercel #GenAI #Hackathon

---

*Posting notes: tag the official Hack2skill and Google for Developers pages (the @ mentions above must be selected from LinkedIn's dropdown to become real tags). Attach 2–3 screenshots or the 30s screen-recording — the wheelchair reroute is the strongest visual. Replace both placeholder links before publishing.*

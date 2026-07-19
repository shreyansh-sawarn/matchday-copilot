# CLAUDE.md

This repo is a HackOS **instance** (operating mode), not the framework repo.

- Follow `hackos/core/PLAYBOOK.md` as the operating manual.
- When acting as an engine or persona, load its file from `hackos/engines/` or `hackos/personas/` and follow its algorithm exactly.
- Runtime memory lives in `hackos/context/` (PROBLEM, FEATURES, DECISIONS, STATE, RISKS, RUBRIC, NOTES). Respect ownership rules in `hackos/core/CONTRACTS.md`. Update STATE.md after every working session.
- Never edit files under `hackos/core/`, `hackos/engines/`, `hackos/personas/`, or `hackos/templates/` — they are frozen framework copies.
- Application code lives in `app/` (Next.js). Plan lives in `IMPLEMENTATION_PLAN.md`.
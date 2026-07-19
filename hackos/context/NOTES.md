# Project Notes

Capture temporary observations, ideas, discoveries, and reminders during the hackathon.

This is a scratchpad.

Information here is temporary unless promoted to another context file.

---

## Current Observations

| Timestamp | Observation | Importance |
| --------- | ----------- | ---------- |
| 2026-07-19 | Build environment: mounted repo FS blocks file deletion mid-session → builds/tests run in a synced local workdir; commits made via clone + ref update. Stale `.git/*.lock` + `node_modules/` need manual deletion on Windows before next local dev session. | High (dev ergonomics only) |
| 2026-07-19 | Gate 2/3 live-Gemini probes (10 scripted grounding checks) DEFERRED — no GEMINI_API_KEY in build environment. Run `node scripts/qa-matrix.mjs` against the deployed URL with the key set, plus manual language review, right after first deploy. | Critical (pre-submission) |
| 2026-07-19 | QA matrix (degraded mode): 35/35 pass — 6 languages × 5 journeys + 5 adversarial probes. PT initially misdetected as ES ("está" collision) — fixed by checking PT-distinctive words first. | High |
| 2026-07-19 | Lighthouse run DEFERRED to deployed URL (no browser in build env). Manual a11y audit done: semantic landmarks, skip-link, aria-live on streamed replies, aria-pressed toggles, visible focus ring, dir="auto" for RTL, prefers-reduced-motion honored, dark-theme contrast ≥ AA for all text styles used. | High |

---

## Organizer Announcements

| Time | Announcement | Impact |
| ---- | ------------ | ------ |

---

## API Notes

| API | Observation | Action |
| --- | ----------- | ------ |

---

## AI Prompt Notes

| Prompt | Observation | Improvement |
| ------ | ----------- | ----------- |

---

## Architecture Notes

| Observation | Follow-up |
| ----------- | --------- |

---

## Implementation Notes

| Observation | Follow-up |
| ----------- | --------- |

---

## Demo Notes

| Observation | Action |
| ----------- | ------ |

---

## Judge Feedback

| Feedback | Suggested Action |
| -------- | ---------------- |

---

## Ideas Parking Lot

Ideas that should not interrupt the current implementation.

| Idea | Priority | Revisit After |
| ---- | -------- | ------------- |

---

## Useful Commands

```text
```

---

## Useful Links

| Resource | Purpose |
| -------- | ------- |

---

## Questions to Revisit

| Question | Trigger |
| -------- | ------- |

---

## Lessons During Development

| Lesson | Recommendation |
| ------ | -------------- |

---

## Cleanup Before Submission

* Remove temporary notes.
* Promote important information to the appropriate context file.
* Archive anything still useful for post-hackathon review.

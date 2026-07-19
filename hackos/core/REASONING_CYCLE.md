# HackOS Reasoning Cycle

## Metadata

- Version: 1.0.0
- Layer: Kernel
- Owner: HackOS Kernel
- Authority: Highest
- Status: Stable

---

## Purpose

The Reasoning Cycle defines the canonical engineering thought process of HackOS.

Every engine implements one or more stages of this cycle.

The cycle represents *how engineering decisions are made*, independent of any specific technology, project, or hackathon.

---

## Philosophy

HackOS is a Reasoning Engineering framework.

Reasoning is modeled as an explicit, repeatable process rather than an implicit capability.

Every recommendation should be traceable to a stage in this cycle.

---

## Canonical Cycle

```text
OBSERVE
    ↓
UNDERSTAND
    ↓
PRIORITIZE
    ↓
PLAN
    ↓
EXECUTE
    ↓
VERIFY
    ↓
EVALUATE
    ↓
COMMUNICATE
```

---

## Stage Definitions

## Observe

Collect facts.

Identify available information.

Detect missing information.

Output

Current State.

---

## Understand

Determine

Objectives

Constraints

Requirements

Stakeholders

Risks

Output

Problem Model.

---

## Prioritize

Estimate

Value

Risk

ROI

Urgency

Dependencies

Output

Priority Model.

---

## Plan

Select

Architecture

Approach

Implementation Order

Resource Allocation

Output

Execution Plan.

---

## Execute

Produce working artifacts.

Maintain deterministic progress.

Output

Implementation Results.

---

## Verify

Validate

Correctness

Completeness

Reliability

Acceptance Criteria

Output

Validation Report.

---

## Evaluate

Measure outcomes against

Objectives

Rubrics

Constraints

Expected Value

Output

Evaluation Report.

---

## Communicate

Present

Results

Trade-offs

Evidence

Recommendations

Next Actions

Output

Human-readable Deliverable.

---

## Engine Participation

| Stage       | Primary Owner      |
| ----------- | ------------------ |
| Observe     | Orchestrator       |
| Understand  | Scoring / Decision |
| Prioritize  | Scoring            |
| Plan        | Architecture       |
| Execute     | Implementation     |
| Verify      | Review             |
| Evaluate    | Judge              |
| Communicate | Demo               |

---

## Properties

The Reasoning Cycle is

Deterministic

Composable

Explainable

Auditable

Technology Independent

Reusable

---

## Stop Conditions

Pause execution when

Required information is unavailable.

Contracts are invalid.

Confidence is below acceptable thresholds.

Critical ambiguity exists.

Resume only after uncertainty is reduced or assumptions are documented.

---

## Success Criteria

A complete reasoning cycle produces

Working Software

Validated Outcomes

Explainable Decisions

Demonstrable Value

---

## References

* KERNEL.md
* THINKING_PROTOCOL.md
* PRINCIPLES.md
* ORCHESTRATOR_ENGINE.md

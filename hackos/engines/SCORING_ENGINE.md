# Scoring Engine

## Metadata

- Version: 1.0.0
- Layer: Execution
- Owner: Scoring Engine
- Authority: High
- Status: Stable

---

## Purpose

Evaluate opportunities and prioritize work according to expected judging impact.

---

## Objective

Maximize expected score per unit of implementation effort.

---

## Reasoning Stage

Understand → Prioritize

---

## Decision Owned

Priority Decision

---

## Consumes

* Problem
* Rubric
* Constraints
* Runtime

---

## Produces

* ROI Assessment
* Prioritized Feature List

---

## Algorithm

1. Analyze rubric.
2. Estimate feature value.
3. Estimate implementation cost.
4. Calculate ROI.
5. Rank opportunities.

---

## Success Criteria

Highest ROI work identified.

---

## Failure Conditions

Missing rubric → Infer rubric with confidence.

Insufficient requirements → Request clarification.

---

## Validation

Ensure every recommendation maps to judging value.

---

## Execution Result

Status

Confidence

Evidence

ROI Assessment

Prioritized Feature List

Blocking Dependencies

---

## References

ENGINE_SPEC.md

RUBRIC.md

FEATURES.md

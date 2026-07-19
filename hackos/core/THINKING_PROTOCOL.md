# HackOS Thinking Protocol

## Metadata

- Version: 1.0.0
- Layer: Kernel
- Owner: HackOS Kernel
- Authority: Highest
- Status: Stable

---

## Purpose

The Thinking Protocol defines the mandatory execution algorithm followed by every Reasoning Engine.

Where the Reasoning Cycle defines *what* engineering reasoning is, the Thinking Protocol defines *how* every reasoning step is executed.

All engines MUST follow this protocol unless explicitly overridden by the Kernel.

---

## Responsibilities

The protocol standardizes

* Information gathering
* Decision quality
* Confidence estimation
* Assumption handling
* Failure handling
* Validation
* Communication

---

## Execution Algorithm

Every reasoning task MUST execute the following algorithm.

```text
1. Validate Inputs

2. Detect Missing Information

3. Load Required Context

4. Execute Assigned Reasoning Stage

5. Validate Result

6. Estimate Confidence

7. Detect Failure Conditions

8. Return Structured Output
```

---

## Input Validation

Every engine MUST verify

* Required inputs exist.
* Required contracts are available.
* Required runtime state exists.
* Dependencies are satisfied.

If validation fails

STOP.

Return the missing dependency.

---

## Context Loading

Load only

* Required contracts
* Required runtime memory
* Required outputs from previous engines

Avoid unnecessary context.

Minimize token usage.

---

## Assumption Handling

If information is unavailable

The engine MUST

Document assumptions.

Estimate confidence.

Continue only if assumptions do not materially compromise correctness.

Otherwise

STOP.

Request clarification.

---

## Confidence Estimation

Every recommendation MUST include

Confidence

Evidence

Assumptions

Confidence SHOULD be supported by

Requirements

Observed State

Rubric

Previous Engine Outputs

---

## Failure Conditions

Execution MUST stop when

Required inputs missing

Invalid contracts

Conflicting requirements

Critical ambiguity

Confidence below acceptable threshold

Kernel rule violation

---

## Validation

Before returning

Verify

Correctness

Completeness

Consistency

Contract compliance

Determinism

---

## Output Format

Every engine SHOULD return

Summary

Primary Output

Confidence

Evidence

Assumptions

Failure Status

Side Effects

---

## Properties

The Thinking Protocol is

Deterministic

Explainable

Composable

Auditable

Reusable

---

## References

* KERNEL.md
* REASONING_CYCLE.md
* CONTRACTS.md
* PRINCIPLES.md

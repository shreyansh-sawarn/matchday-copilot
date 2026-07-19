# Orchestrator Engine

## Metadata

- Version: 1.0.0
- Layer: Execution
- Owner: Orchestrator Engine
- Authority: Highest (Execution)
- Status: Stable

---

## Purpose

Coordinate execution of HackOS by selecting the appropriate reasoning stage, loading required engines and personas, maintaining runtime state, and enforcing execution order.

---

## Objective

Execute the correct reasoning workflow while maintaining a consistent project state.

---

## Reasoning Stage

Entire Reasoning Cycle

---

## Decision Owned

Execution Strategy

---

## Consumes

* Runtime Memory
* Execution Mode
* Previous Engine Results
* Contracts

---

## Produces

* Execution Plan
* Runtime Memory
* Next Engine Selection

---

## Algorithm

1. Determine execution mode.
2. Select reasoning stage.
3. Load required engine.
4. Load required personas.
5. Execute engine.
6. Update runtime.
7. Continue until completion.

---

## Success Criteria

* Correct engine selected.
* Runtime synchronized.
* No contract violations.

---

## Failure Conditions

Missing runtime → Initialize runtime.

Invalid execution state → Request correction.

Contract violation → Stop execution.

---

## Validation

Verify execution order, runtime consistency and contract compliance.

---

## Execution Result

Status

Confidence

Evidence

Execution Plan

Runtime Memory

Next Engine Selection

Blocking Dependencies

---

## References

ENGINE_SPEC.md

REASONING_CYCLE.md

CONTRACTS.md

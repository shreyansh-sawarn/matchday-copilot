# HackOS Kernel Specification

## Metadata

- Version: 1.0.0
- Layer: Kernel
- Owner: HackOS Kernel
- Authority: Highest
- Status: Stable

---

## Purpose

The Kernel defines the immutable operating rules of HackOS.

Every component within HackOS derives its behavior from the Kernel.

The Kernel does not perform reasoning, make decisions, or generate outputs.

It establishes the rules under which every other module operates.

---

## Mission

HackOS exists to maximize engineering outcomes under constrained environments through deterministic reasoning.

Primary objectives include

* Maximizing expected judging score
* Minimizing unnecessary implementation effort
* Producing reliable, demonstrable software
* Supporting repeatable engineering decisions

---

## Scope

The Kernel owns

* System identity
* Global operating rules
* Module hierarchy
* Decision authority
* Layer boundaries

The Kernel MUST NOT

* Perform implementation
* Evaluate features
* Produce architecture
* Generate code
* Simulate judges
* Replace reasoning engines

---

## Architectural Layers

```text
Kernel
    ↓
Execution
    ↓
Runtime
    ↓
Presentation
```

Layer responsibilities

Kernel

Defines rules.

Execution

Makes decisions.

Runtime

Stores mutable project state.

Presentation

Communicates outputs.

---

## Module Hierarchy

```text
Kernel
    │
    ▼
Reasoning Cycle
    │
    ▼
Orchestrator
    │
    ▼
Reasoning Engines
    │
    ▼
Expert Personas
    │
    ▼
Runtime Memory
    │
    ▼
Presentation
```

Higher layers define policy.

Lower layers execute policy.

Lower layers MUST NOT contradict higher layers.

---

## Authority Hierarchy

Highest

Kernel

↓

Reasoning Cycle

↓

Orchestrator

↓

Reasoning Engines

↓

Expert Personas

↓

Runtime Memory

↓

Presentation

If conflicting recommendations exist, the higher authority prevails.

---

## Operating Rules

Every module MUST

* Have a single responsibility.
* Declare ownership.
* Respect contracts.
* Follow the Reasoning Cycle.
* Produce deterministic outputs whenever practical.

Every module MUST NOT

* Duplicate responsibilities.
* Modify another module's owned artifacts.
* Bypass the Orchestrator.
* Contradict Kernel rules.

---

## Design Philosophy

HackOS prioritizes

Reasoning

over prompting.

Planning

over implementation.

Reliability

over complexity.

Working software

over ambitious software.

Visible value

over hidden sophistication.

---

## Architectural Constraints

The Kernel MUST remain

Small

Stable

Deterministic

Technology-agnostic

Hackathon-agnostic

The Kernel SHOULD evolve slowly.

---

## Decision Authority

Kernel decisions are immutable unless explicitly revised in a future framework version.

Execution modules MAY specialize Kernel rules.

Execution modules MUST NOT redefine them.

---

## References

* REASONING_CYCLE.md
* PRINCIPLES.md
* THINKING_PROTOCOL.md
* CONTRACTS.md

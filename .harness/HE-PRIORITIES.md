# HE-PRIORITIES — CareerHelper Protocol Test

**Date:** 2026-04-09
**Assessment Type:** Focused priority list derived from current slot/touch-point state

## Tier 1 — Immediate

### 1. P1-10 Requirements Ledger

- **Why first:** CareerHelper already has a live planning surface (`PLAN.md`) and a strong verification surface. The missing piece is an authoritative requirement source that can authorize non-trivial work.
- **Impact:** High
- **Remediation level:** Medium

### 2. P2-5 Upstream Intake Gate

- **Why second:** Once a requirements ledger exists, this repo can mechanically block plan execution that is not tied to a valid requirement.
- **Impact:** High
- **Remediation level:** Medium

### 3. P2-3 Independent Review Durability

- **Why third:** CareerHelper already has AI review automation, so the next leverage point is durable in-repo approval evidence rather than inventing a second reviewer mechanism.
- **Impact:** High
- **Remediation level:** Medium

## Tier 2 — Mid-term

### 4. P0-11 Portable Agent Surface

- **Why:** Instructions are strong, but split across `CLAUDE.md`, `HARNESS.md`, and `instructions.md`. A canonical portable root contract would reduce drift.
- **Impact:** Medium
- **Remediation level:** Medium

### 5. P1-7 Planning Discipline Hardening

- **Why:** `PLAN.md` usage exists but is still warning-backed rather than a firm gate.
- **Impact:** Medium
- **Remediation level:** Light

## Tier 3 — Hygiene / Follow-on

### 6. Audit Surface Cleanup

- **Why:** Existing root-level `HE-*` files are stale and should either be archived, moved under `.harness/`, or clearly superseded.
- **Impact:** Low
- **Remediation level:** Light
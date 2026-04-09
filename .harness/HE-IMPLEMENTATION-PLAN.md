# HE-IMPLEMENTATION-PLAN — CareerHelper Protocol Test

**Project Scope:** CareerHelper, SAS monorepo with strong existing verification/orchestration slots and weaker intake/review durability slots

> **STOP after generating this plan — present to user for review before Phase 4 mutation.**

## Tier 1 (Immediate Execution)

### 1-1. P1-10 Requirements Ledger
- **Remediation Level:** Medium
- **Prevention Active:** planning can proceed from freeform task intent rather than a durable requirement source
- **Dependencies:** None
- **Implementation Guide:** `references/he-p1-10-requirements-ledger-mount-pattern.md`
- **Action Items** _(from the feature's guide when present; otherwise from the feature's L4 section):_
  - `REQUIREMENTS.md` — add a machine-readable requirement ledger suited to CareerHelper's monorepo and product/workstream structure
  - `CLAUDE.md` and/or portable contract surface — point non-trivial task planning at the canonical requirements ledger
  - `PLAN.md` usage flow — make active task plans cite requirement IDs from the new ledger
- **Remediation Tier:** Tier 1 — establish authorized intake before broader harness hardening
- **Verification:** create a new task plan entry that cites a valid requirement ID and confirm the repo can resolve it to the new ledger

### 1-2. P2-5 Upstream Intake Gate
- **Remediation Level:** Medium
- **Prevention Active:** `PLAN.md` discipline is instructional and warning-backed, but not blocked when requirements are absent or mistyped
- **Dependencies:** `P1-10 Requirements Ledger`
- **Implementation Guide:** `references/he-p2-5-intake-gate-mount-pattern.md`
- **Action Items** _(from the feature's guide when present; otherwise from the feature's L4 section):_
  - `scripts/verify-changes.sh` or a new narrow validator — fail or strongly gate changes when active planning does not cite a valid requirement
  - `PLAN.md` — keep the live planning slot, but tie it mechanically to the requirement source once the user approves this batch
  - `CLAUDE.md` / portable contract surface — document the intake rule as a hard gate instead of advice only
- **Remediation Tier:** Tier 1 — convert planning from soft discipline into authorized intake
- **Verification:** intentionally cite an unknown requirement ID in `PLAN.md`; confirm the chosen gate fails. Restore a valid ID; confirm the same gate passes.

### 1-3. P2-3 Independent Review Durability
- **Remediation Level:** Medium
- **Prevention Active:** review automation exists, but protected harness changes leave no durable machine-readable approval record in the repo itself
- **Dependencies:** None
- **Implementation Guide:** `references/he-p2-3-review-mount-pattern.md`
- **Action Items** _(from the feature's guide when present; otherwise from the feature's L4 section):_
  - `REVIEWS.md` — mount a root review ledger for protected repo surfaces
  - `CLAUDE.md` or portable contract surface — define review-required surfaces and generator/reviewer separation
  - `.github/workflows/ai-review.yml` or another narrow repo-native gate — keep existing AI review, but add ledger-based approval durability rather than replacing current review automation
- **Remediation Tier:** Tier 1 — make review evidence durable and auditable
- **Verification:** make a protected harness change without a matching review record and confirm the gate fails; add a valid review record and confirm it passes.

## Tier 2 (Mid-term Execution)

### 2-1. P0-11 Portable Agent Surface
- **Remediation Level:** Medium
- **Prevention Active:** contract guidance is strong but split across multiple agent-specific or support files
- **Dependencies:** None
- **Implementation Guide:** `None`
- **Action Items** _(from the feature's guide when present; otherwise from the feature's L4 section):_
  - `AGENTS.md` — create a portable canonical contract that consolidates repo-wide rules now split across `CLAUDE.md`, `HARNESS.md`, and `instructions.md`
  - retain IDE/tool-specific shims only as pointers back to the canonical root contract
- **Remediation Tier:** Tier 2 — improve portability once intake and review durability are established
- **Verification:** confirm a future agent can recover the main project rules from one root canonical file without relying on tool-specific discovery behavior

### 2-2. P1-7 Planning Discipline Hardening
- **Remediation Level:** Light
- **Prevention Active:** live planning exists but is still warning-backed and template-driven
- **Dependencies:** `P1-10 Requirements Ledger`, `P2-5 Upstream Intake Gate`
- **Implementation Guide:** `references/he-p1-7-planning-mount-pattern.md`
- **Action Items** _(from the feature's guide when present; otherwise from the feature's L4 section):_
  - strengthen `PLAN.md` activation and session-log discipline once intake is requirements-backed
  - decide whether the blank template should remain the default or be replaced by a more operational starter format
- **Remediation Tier:** Tier 2 — improve planning quality after the repo has authorized intake
- **Verification:** start a new multi-step task and confirm the plan surface is both filled and requirements-linked before implementation begins

## Tier 3 (Long-term Backlog)

### 3-1. Audit Surface Cleanup
- **Reason Deferred:** hygiene follow-on; useful, but weaker than intake/review durability
- **Implementation Guide:** `None`
- **Action Items** _(from the feature's guide when present; otherwise from the feature's L4 section):_
  - archive, relocate, or supersede the stale root `HE-*` files so future audits rely on `.harness/` instead of outdated planning surfaces

## Protocol Note

This test kept mutation to:

- the required live planning slot (`PLAN.md`)
- the safe staging slot (`.harness/`)

It intentionally did **not** retarget CareerHelper's stronger live operational surfaces because no remediation batch has been approved yet.
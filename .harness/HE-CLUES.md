# HE-CLUES — CareerHelper Protocol-Driven Findings

**Date:** 2026-04-09
**Assessment Type:** Focused reassessment through the harness-injection slot/touch-point protocol

## Key Observation

CareerHelper is not a low-maturity repo that needs a full harness rebuild. It already has multiple strong harness slots, but some of the strongest controls are distributed across split contract surfaces and are not yet anchored by durable intake/review artifacts.

## Findings

### 1. Requirements Slot Is Missing

- **Related features:** `P1-10 Requirements Ledger`, `P2-5 Upstream Intake Gate`
- **Current touch-points:** none canonical
- **Evidence:** no `REQUIREMENTS.md` or equivalent machine-readable requirement ledger found; `PLAN.md` exists but is not coupled to a requirement source
- **Protocol reading:** the planning slot exists, but the intake slot is missing; this weakens safe transition from Stage → Approve Transition → Inject
- **Remediation level:** Medium

### 2. Review Slot Exists But Lacks Durable Approval Evidence

- **Related feature:** `P2-3 AI Auditors & Collaboration Channels`
- **Current touch-points:** `.github/workflows/ai-review.yml`, `.github/workflows/meta-sync.yml`
- **Evidence:** automated PR review exists, but no root review ledger stores machine-readable approval evidence for protected surfaces
- **Protocol reading:** review behavior is partially injected into CI, but audit proof is weak because the approval artifact is not durable in-repo
- **Remediation level:** Medium

### 3. Planning Slot Exists But Discipline Is Still Soft

- **Related feature:** `P1-7 Planning & State`
- **Current touch-points:** `PLAN.md`, `CLAUDE.md`, `scripts/verify-changes.sh`
- **Evidence:** plan usage is mandatory by instruction and warning-backed in verification, but the repo still ships a blank template by default and the check is non-blocking
- **Protocol reading:** planning slot is present and live, but its mutation policy is weaker than the slot's importance suggests
- **Remediation level:** Light

### 4. Portable Contract Surface Is Split

- **Related feature:** `P0-11 Portable Agent Surface`
- **Current touch-points:** `CLAUDE.md`, `HARNESS.md`, `instructions.md`
- **Evidence:** strong instructions exist, but not through a single IDE-agnostic canonical root contract such as `AGENTS.md`
- **Protocol reading:** contract slot is strong in content but fragmented in carrier surfaces
- **Remediation level:** Medium

### 5. Existing Root-Level HE Artifacts Are Stale Planning Surfaces

- **Related protocol concern:** touch-point hygiene
- **Current touch-points:** `HE-CLUES.md`, `HE-IMPLEMENTATION-PLAN.md`, `HE-PRIORITIES.md` at repo root
- **Evidence:** they reflect an older state that undercounts current slots like `.mcp.json`, `.claude/settings.local.json`, `ai-review.yml`, and `meta-sync.yml`
- **Protocol reading:** stale planning surfaces can mislead future audits if not clearly superseded by `.harness/` outputs
- **Remediation level:** Light

## Strong Slots Confirmed

- **Verification:** `scripts/verify-changes.sh`, `test.yml`, root package scripts
- **Sandboxing:** `.claude/settings.local.json` plus `scripts/sandbox-check.sh`
- **Orchestration:** `.agents/README.md`, prompt templates, skills directory
- **MCP tooling:** `.mcp.json`
- **Meta-sync:** `.github/workflows/meta-sync.yml`

## Protocol Test Result

The protocol added value because it separated:

- what is already a strong live operational surface
- what should remain untouched until a remediation batch is approved
- what is safe to stage under `.harness/`

That produced a narrower, safer set of next actions than the older root HE audit.
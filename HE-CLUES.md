# HE-CLUES — CareerHelper Gap Analysis
**Date:** 2026-03-29 (Updated — supersedes prior audit)
**Project:** CareerHelper (Monorepo — SAS)
**Tech Stack:** Node.js Lambda, React, React Native, AWS CDK, Yarn Workspaces

> **Note:** Prior audit (in this file) assessed maturity at ~1.5/5. This re-audit reflects
> significant improvements made since then. Many previously flagged gaps are now resolved.

---

## FOUNDATION

**Area:** Foundation
**Feature:** F1 Bash Sandboxes
**Current State:** No `.claude/settings.local.json` in project root. Agent runs directly on developer machine with no isolation layer.
**Missing Capability:** Isolated sandbox for agent execution; rollback-safe environment separate from the developer's machine.
**Remediation Level:** Heavy
---

**Area:** Foundation
**Feature:** F2 Filesystem & Git ✅
**Current State:** Git-tracked repo, clean history, CI/CD pipelines in place. All harness files versioned.
**Missing Capability:** Nothing — fully covered.
**Remediation Level:** N/A
---

**Area:** Foundation
**Feature:** F3 Self-Verification ✅
**Current State:** `scripts/verify-changes.sh` runs ESLint + Prettier + Jest. Hooked via Husky pre-commit. CLAUDE.md documents `yarn verify` as the pre-push gate.
**Missing Capability:** Nothing — fully covered.
**Remediation Level:** N/A
---

**Area:** Foundation
**Feature:** F4 Ralph Loops ⚠️
**Current State:** CLAUDE.md has a dedicated "Long Task Handling (Ralph Loops)" section with PLAN.md checkpoint/resume protocol. `PLAN.md` exists but is an unfilled blank template — no active task is being tracked.
**Missing Capability:** Active discipline around PLAN.md usage; structure exists but is not being used.
**Remediation Level:** Light
---

**Area:** Foundation
**Feature:** F5 Orchestration
**Current State:** No `.agents/` directory, no subagent spawning config, no MAS orchestration layer of any kind.
**Missing Capability:** Mechanism for agent to spawn sub-agents and hand off work for parallel workstreams.
**Remediation Level:** Heavy
---

**Area:** Foundation
**Feature:** F6 Rippable Middleware
**Current State:** No feature-flag system or documented middleware disable mechanism. No toggleable layers in CLAUDE.md.
**Missing Capability:** Ability to cleanly disable extraneous logic layers without breaking the system.
**Remediation Level:** Medium
---

**Area:** Foundation
**Feature:** F7 Escalation ✅
**Current State:** CLAUDE.md has explicit "Escalation Triggers": AWS credentials, production deployments, architectural conflicts, >10 tool calls without resolution, business logic uncertainty.
**Missing Capability:** Nothing — fully covered.
**Remediation Level:** N/A
---

**Area:** Foundation
**Feature:** F8 Harness Versioning ✅
**Current State:** CLAUDE.md, ANCHORS.md, PLAN.md, all `.github/workflows/`, and `.dependency-cruiser.json` are tracked in git.
**Missing Capability:** Nothing — fully covered.
**Remediation Level:** N/A
---

## PILLAR 1 (INFORM)

**Area:** Pillar 1
**Feature:** P1-1 Repository as Truth ✅
**Current State:** `CLAUDE.md` is comprehensive: architecture, commands, conventions, data models, critical files, quality gates, git workflow, escalation policy, coding standards.
**Missing Capability:** Nothing — fully covered.
**Remediation Level:** N/A
---

**Area:** Pillar 1
**Feature:** P1-2 Context Compaction
**Current State:** Ralph Loops references PLAN.md for continuity but no explicit context-window management (summary-before-flush instructions, tiered memory loading strategy).
**Missing Capability:** Explicit instructions in CLAUDE.md to summarize and flush raw file contents before proceeding to next phase on long tasks.
**Remediation Level:** Light
---

**Area:** Pillar 1
**Feature:** P1-3 Tool Offloading
**Current State:** No disk-offloading mechanism for large tool outputs. Full outputs remain in agent context.
**Missing Capability:** Pattern for saving verbose outputs (test results, build logs) to disk and passing only token-efficient summaries forward.
**Remediation Level:** Medium
---

**Area:** Pillar 1
**Feature:** P1-4 Progressive Skills
**Current State:** No `.agents/skills/` directory or on-demand tool loading pattern.
**Missing Capability:** Skills/tools loaded by sub-agents on-demand rather than all-at-once at session start.
**Remediation Level:** Medium
---

**Area:** Pillar 1
**Feature:** P1-5 Observability ✅
**Current State:** `ci-cd.yml` and `test.yml` fire on push/PR. Coverage uploaded to Codecov. Agent can query CI status via `gh` CLI.
**Missing Capability:** Nothing — fully covered.
**Remediation Level:** N/A
---

**Area:** Pillar 1
**Feature:** P1-6 Web Search / MCP
**Current State:** No MCP server config found in project (no `mcp.json`, `.mcp` file, or `.claude/settings.local.json`).
**Missing Capability:** Documented MCP server registration giving the agent native web search and external tool access beyond model knowledge cutoff.
**Remediation Level:** Medium
---

**Area:** Pillar 1
**Feature:** P1-7 Planning & State ⚠️
**Current State:** `PLAN.md` exists as a well-structured template. CLAUDE.md documents checkpoint/resume protocol. However the template is blank — no active task state is tracked.
**Missing Capability:** Consistent PLAN.md usage on non-trivial tasks (partial gap — structure exists, discipline is missing).
**Remediation Level:** Light
---

**Area:** Pillar 1
**Feature:** P1-8 Context Anchoring ✅
**Current State:** `ANCHORS.md` contains 5 ADRs: serverless architecture, monorepo structure, DynamoDB single-table, circuit breaker, Amplify DataStore offline.
**Missing Capability:** Nothing — fully covered.
**Remediation Level:** N/A
---

**Area:** Pillar 1
**Feature:** P1-9 Branch-Based Memory
**Current State:** No branch-per-objective decomposition. No concurrent branch memory tracking pattern.
**Missing Capability:** Strategy for decomposing large objectives into concurrent git branches each with scoped commit memory.
**Remediation Level:** Medium
---

## PILLAR 2 (CONSTRAIN)

**Area:** Pillar 2
**Feature:** P2-1 Automated Linters ✅
**Current State:** Husky pre-commit runs `verify-changes.sh` (ESLint + Prettier + Jest). `lint-staged` configured. CI `test.yml` also runs `yarn lint` + `yarn test:coverage`.
**Missing Capability:** Nothing — fully covered.
**Remediation Level:** N/A
---

**Area:** Pillar 2
**Feature:** P2-2 Dependency Enforcement ✅
**Current State:** `.dependency-cruiser.json` enforces 5 workspace boundary rules (no web→backend, no web→mobile, shared is read-only). `cleanup.yml` runs it weekly + depcheck for unused packages.
**Missing Capability:** Nothing — fully covered.
**Remediation Level:** N/A
---

**Area:** Pillar 2
**Feature:** P2-3 AI Auditors
**Current State:** No secondary agent or automated review process inspects primary agent output. All code review is human-dependent.
**Missing Capability:** Secondary agent or automated prompt that reviews code changes, CLAUDE.md drift, or coverage gaps before merge.
**Remediation Level:** Medium
---

**Area:** Pillar 2
**Feature:** P2-4 Bounded Autonomy ✅
**Current State:** CLAUDE.md specifies escalation triggers with explicit limits (>10 tool calls, AWS credentials, production deployments, business logic uncertainty).
**Missing Capability:** Nothing — fully covered.
**Remediation Level:** N/A
---

## PILLAR 3 (MAINTAIN)

**Area:** Pillar 3
**Feature:** P3-1 Scheduled Cleanups ✅
**Current State:** `cleanup.yml` runs every Monday 08:00 UTC: deletes merged branches, flags stale branches >90 days, runs dependency-cruiser, runs depcheck.
**Missing Capability:** Nothing — fully covered.
**Remediation Level:** N/A
---

**Area:** Pillar 3
**Feature:** P3-2 Documentation Sync ⚠️
**Current State:** `doc-sync.yml` checks README freshness vs src/ changes and API doc freshness vs Lambda changes. Warns on breaking-change commits. Fires on push/PR.
**Missing Capability:** Enforcement is advisory only (warns, does not fail CI). Should harden to a pipeline failure for stale docs on breaking changes.
**Remediation Level:** Light
---

**Area:** Pillar 3
**Feature:** P3-3 Pattern Auditing ✅
**Current State:** `.dependency-cruiser.json` detects boundary violations and circular dependencies. depcheck catches unused packages. Both run weekly in `cleanup.yml`.
**Missing Capability:** Nothing — fully covered.
**Remediation Level:** N/A
---

**Area:** Pillar 3
**Feature:** P3-4 Consolidation Loop
**Current State:** No automated check that `CLAUDE.md` or `ANCHORS.md` stay in sync with code reality (new commands, changed file paths, new ADRs needed).
**Missing Capability:** Scheduled or trigger-based workflow that flags meta-doc drift from the codebase.
**Remediation Level:** Light
---

## Summary

| Status | Count | Features |
|--------|-------|---------|
| ✅ Pass | 13 | F2, F3, F7, F8, P1-1, P1-5, P1-8, P2-1, P2-2, P2-4, P3-1, P3-3 |
| ⚠️ Partial | 3 | F4, P1-7, P3-2 |
| ❌ Gap | 9 | F1, F5, F6, P1-2, P1-3, P1-4, P1-6, P1-9, P2-3, P3-4 |

**Harness Maturity: Level 2 (Developing) — up from Level 1 (Basic) in prior audit**
Strong CI/CD constraint and maintenance layers. Gaps concentrated in agent isolation, orchestration, and context management.

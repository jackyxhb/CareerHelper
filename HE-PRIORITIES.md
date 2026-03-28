# HE-PRIORITIES — CareerHelper Gap Priorities
**Date:** 2026-03-29
**Formula:** Priority Score = (5 - Composite) × Impact Weight × Cascade Length

---

## Tier 1 — Immediate (This Sprint)

| Rank | Feature | Priority Score | Composite | Remediation |
|------|---------|---------------|-----------|-------------|
| 1 | F1 Bash Sandboxes | 30 | 0.0 | Heavy |
| 2 | F5 Orchestration | 20 | 0.0 | Heavy |
| 3 | P1-7 Planning & State | 12 | 2.0 | Light |

**Why these:** F1 and F5 are fully absent with high downstream dependency weights (3 and 2 respectively) and cascade length 2. P1-7 is partial but unlocks both F4 (Ralph Loops) and P1-4 (Progressive Skills) downstream — high leverage for a light fix.

---

## Tier 2 — Mid-term (This Quarter)

| Rank | Feature | Priority Score | Composite | Remediation |
|------|---------|---------------|-----------|-------------|
| 4 | P1-2 Context Compaction | 5 | 0.0 | Light |
| 5 | F6 Rippable Middleware | 5 | 0.0 | Medium |
| 6 | P1-3 Tool Offloading | 5 | 0.0 | Medium |
| 7 | P1-4 Progressive Skills | 5 | 0.0 | Medium |
| 8 | P1-6 Web Search / MCP | 5 | 0.0 | Medium |
| 9 | P2-3 AI Auditors | 5 | 0.0 | Medium |

**Why these:** All score 5 (fully absent with no cascade multiplier). Ordered Light-first; Medium items require more build effort.

---

## Tier 3 — Long-term (This Half)

| Rank | Feature | Priority Score | Composite | Remediation |
|------|---------|---------------|-----------|-------------|
| 10 | P1-9 Branch-Based Memory | 5 | 0.0 | Medium |
| 11 | P3-4 Consolidation Loop | 5 | 0.0 | Light |
| 12 | F4 Ralph Loops | 3 | 2.0 | Light |
| 13 | P3-2 Documentation Sync | 2 | 2.83 | Light |

**Why deferred:** P1-9 is aspirational for a SAS project. P3-4 and F4 need process discipline more than tooling. P3-2 already warns — just needs hardening to fail CI.

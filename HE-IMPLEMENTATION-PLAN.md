# HE-IMPLEMENTATION-PLAN — CareerHelper
**Date:** 2026-03-29
**Project Scope:** CareerHelper, SAS (Single Agent), Monorepo

> **STOP after generating this plan — present to user for review before executing Phase 4.**

---

## Tier 1 — Immediate (This Sprint)

### 1-1. F1 Bash Sandboxes
- **Remediation Level:** Heavy
- **Action Items:**
  - `/.claude/settings.local.json` Add project-scoped Claude Code settings with permission allowlist — lock down destructive bash commands (rm -rf, force-push, db drops) to require explicit approval
  - `CLAUDE.md` Add "Sandbox Protocol" section: document that for any task touching infra or deployments, the agent must use `isolation: "worktree"` (Claude Code git worktree isolation) to work in a throwaway branch
  - `scripts/` Add `scripts/sandbox-check.sh` that detects when the agent is running on a local dev machine vs CI and emits a warning if destructive operations are attempted outside CI
  - `ANCHORS.md` Record new ADR for sandbox isolation approach

### 1-2. F5 Orchestration
- **Remediation Level:** Heavy
- **Action Items:**
  - `.agents/` Create `.agents/` directory as the orchestration home
  - `.agents/README.md` Document the supervisor pattern: primary agent decomposes tasks → spawns sub-agents per workstream → collects results
  - `.agents/prompts/` Create role-specific sub-agent prompt templates: `reviewer.md`, `test-writer.md`, `infrastructure.md`
  - `CLAUDE.md` Add "Orchestration" section: when a task spans >2 workstreams or >15 expected tool calls, decompose into sub-agent handoffs using the `.agents/prompts/` templates
  - `ANCHORS.md` Record ADR for orchestration pattern chosen (supervisor vs swarm)

### 1-3. P1-7 Planning & State
- **Remediation Level:** Light
- **Action Items:**
  - `CLAUDE.md` Harden the Ralph Loops section: make PLAN.md mandatory (not optional) for any task requiring >3 tool calls. Add explicit rule: "Do not begin implementation without first writing an active PLAN.md"
  - `PLAN.md` Replace the current blank template with an example of a filled-in plan so agents have a concrete reference
  - `scripts/verify-changes.sh` Add a check: if staged files include `backend/` or `web/src/` but `PLAN.md` is still the blank template, emit a warning to prompt the agent to fill it in

---

## Tier 2 — Mid-term (This Quarter)

### 2-1. P1-2 Context Compaction
- **Remediation Level:** Light
- **Action Items:**
  - `CLAUDE.md` Add "Context Compaction Protocol" section with explicit rules:
    1. At every major phase boundary, write a summary of findings to disk before continuing
    2. After reading >5 files, flush raw content from active thinking and carry forward only conclusions
    3. Use `<scratchpad>` tags for intermediate reasoning to keep final context clean
  - `.agents/logs/` Create `.agents/logs/` directory for offloading verbose output; add to `.gitignore`

### 2-2. F6 Rippable Middleware
- **Remediation Level:** Medium
- **Action Items:**
  - `CLAUDE.md` Add "Middleware Layers" section listing each toggleable behavior (circuit breaker, lint-staged, dependency-cruiser) with instructions for disabling each cleanly
  - `.agents/middleware/` Create directory with one config file per middleware layer documenting its on/off toggle
  - `package.json` Ensure each hook in the `scripts` block is independently callable (no hidden coupling between verification steps) — verify that `yarn lint`, `yarn test`, `yarn format:check` can each run independently

### 2-3. P1-3 Tool Offloading
- **Remediation Level:** Medium
- **Action Items:**
  - `CLAUDE.md` Add "Tool Output Protocol": when a tool returns >50 lines, save full output to `.agents/logs/YYYY-MM-DD-<task>.log` and pass only a 5-line summary forward
  - `.agents/logs/.gitkeep` Add placeholder so directory is tracked but logs are gitignored
  - `.gitignore` Add `.agents/logs/*.log` entry

### 2-4. P1-4 Progressive Skills
- **Remediation Level:** Medium
- **Action Items:**
  - `.agents/skills/` Create skills directory for on-demand tool modules
  - `.agents/skills/README.md` Document the progressive loading protocol: sub-agents load only the skill files relevant to their assigned workstream
  - Move any existing role-specific prompt templates from `.agents/prompts/` into `.agents/skills/` with frontmatter (name, description, when-to-load)

### 2-5. P1-6 Web Search / MCP
- **Remediation Level:** Medium
- **Action Items:**
  - `.claude/settings.local.json` Register MCP server entries for web search (e.g. Brave Search MCP) and any internal tools
  - `CLAUDE.md` Add "MCP Tools" section documenting available MCP servers, what each provides, and when to use each
  - `ANCHORS.md` Record ADR for MCP server selection

### 2-6. P2-3 AI Auditors
- **Remediation Level:** Medium
- **Action Items:**
  - `.github/workflows/ai-review.yml` Create new workflow: on PR open, call Claude API to review diff for: (1) test coverage gaps, (2) CLAUDE.md convention violations, (3) missing ADR entries for architectural changes
  - `.agents/prompts/reviewer.md` Create the reviewer agent prompt with a structured checklist output format
  - `CLAUDE.md` Document the AI review gate: PRs require AI auditor pass before human review

---

## Tier 3 — Long-term Backlog (This Half)

### 3-1. P1-9 Branch-Based Memory
- **Remediation Level:** Medium
- **Action Items:**
  - `CLAUDE.md` Add branch naming protocol for sub-tasks: `agent/<objective-slug>/<sub-task>`
  - `CLAUDE.md` Add commit message convention: each commit should include what the agent decided and why (not just what changed), so commit history serves as cognitive memory
  - `.agents/README.md` Document branch decomposition pattern for objectives spanning >3 sessions

### 3-2. P3-4 Consolidation Loop
- **Remediation Level:** Light
- **Action Items:**
  - `.github/workflows/meta-sync.yml` Create workflow: on push to main, check if `CLAUDE.md` or `ANCHORS.md` were NOT modified in the same PR as changes to `backend/`, `shared/`, or `infrastructure/` — emit a warning comment on the PR
  - `CLAUDE.md` Add rule: any PR that changes architecture, commands, or data models must include a `CLAUDE.md` or `ANCHORS.md` update

### 3-3. F4 Ralph Loops (Harden)
- **Remediation Level:** Light
- **Action Items:**
  - `CLAUDE.md` Add explicit "Session Log" discipline to the Ralph Loops section: every session that modifies files must append an entry to `PLAN.md`'s Session Log before terminating
  - `PLAN.md` Add a "Max Loop Budget" field to the plan template: after N sessions without completing the objective, escalate to human

### 3-4. P3-2 Documentation Sync (Harden)
- **Remediation Level:** Light
- **Action Items:**
  - `.github/workflows/doc-sync.yml` Change the breaking-change doc check from a warning (`echo`) to a hard failure (`exit 1`) when commits with "breaking" keyword exist and docs were not updated
  - `.github/workflows/doc-sync.yml` Add a step that fails CI if `docs/api.md` is older than 30 days and Lambda functions have been modified in that period

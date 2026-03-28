# Agent Orchestration

This directory contains orchestration infrastructure for AI agent workflows on CareerHelper.

## Directory Structure

```
.agents/
├── README.md          # This file — orchestration protocol
├── prompts/           # Role-specific sub-agent prompt templates
│   ├── reviewer.md    # Code review + compliance auditor
│   ├── test-writer.md # Test generation specialist
│   └── infrastructure.md # AWS/CDK infrastructure specialist
├── skills/            # On-demand skill modules (loaded progressively)
└── logs/              # Verbose tool output offload (gitignored)
```

## Supervisor Pattern

When a task spans >2 workstreams or requires >15 tool calls, decompose it using
the supervisor pattern rather than executing monolithically:

```
Primary Agent (Supervisor)
├── Decomposes objective into workstreams
├── Spawns sub-agent per workstream using prompts/ templates
├── Collects results and integrates
└── Runs self-verification (yarn verify) before completing
```

## When to Spawn a Sub-Agent

Spawn a sub-agent when the task requires:
- **Isolated expertise:** Code review, test writing, infra changes (use prompts/)
- **Parallel workstreams:** Frontend + backend changes that don't conflict
- **Context protection:** Keeping a large codebase scan from polluting the primary context

## How to Hand Off

1. Write the sub-task scope to `PLAN.md` (sub-task section)
2. Select the appropriate prompt template from `prompts/`
3. Spawn sub-agent with the template + relevant file context
4. Sub-agent writes results to a clearly named output file
5. Primary agent reads results and continues

## Sub-Agent Constraints

- Sub-agents must run `yarn verify` before declaring done
- Sub-agents must not touch files outside their declared scope
- Sub-agents must append their session entry to `PLAN.md` Session Log
- Destructive operations require `scripts/sandbox-check.sh` first

## Branch-Based Memory for Large Objectives

When an objective spans >3 sessions or >2 parallel workstreams, use branch decomposition:

```
main
└── feature/<objective>          # integration branch
    ├── agent/<objective>/web    # sub-agent: frontend workstream
    ├── agent/<objective>/api    # sub-agent: backend workstream
    └── agent/<objective>/infra  # sub-agent: infrastructure workstream
```

Each `agent/` branch is the cognitive boundary for that workstream:
- One sub-agent owns one branch
- Commits on that branch are its memory log
- Commit messages must include rationale (not just "what changed")
- Branch is merged into the feature branch when the workstream is complete

**Session Log discipline (mandatory):** Before ending any session that modifies files,
append a Session Log entry to `PLAN.md`. No exceptions — this is how the next session
resumes without re-reading the entire codebase.

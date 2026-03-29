# Architectural Decision Records

This file records critical architectural decisions made for the CareerHelper project. Use this as a reference for understanding why certain design choices were made.

---

## ADR-001: Serverless Architecture

**Date:** 2024-01-15
**Status:** Accepted

### Context
We needed an architecture that could scale automatically, minimize operational overhead, and optimize costs for a career management platform with variable traffic patterns.

### Decision
Use AWS Lambda with API Gateway for backend compute. This enables:
- Auto-scaling without capacity planning
- Pay-per-invocation pricing model
- Minimal server management
- Fast deployment cycles

### Consequences
- **Positive:** Zero idle capacity costs, automatic scaling, reduced DevOps burden
- **Negative:** Cold start latency, execution time limits (15 minutes), statelessness challenges

---

## ADR-002: Monorepo Structure

**Date:** 2024-01-15
**Status:** Accepted

### Context
We needed to manage shared code between backend, web, and mobile while maintaining independent deployment capabilities.

### Decision
Use Yarn Workspaces for monorepo management:
- `backend/` - Serverless Lambda functions
- `web/` - React web application
- `mobile/` - React Native mobile app
- `shared/` - TypeScript interfaces and utilities
- `infrastructure/` - AWS CDK infrastructure

### Consequences
- **Positive:** Shared types, unified tooling, atomic commits across packages
- **Negative:** Larger repo size, potential for unintended dependencies

---

## ADR-003: DynamoDB Single-Table Design

**Date:** 2024-02-01
**Status:** Accepted

### Context
We needed a database that could handle user-scoped data partitioning with efficient query patterns.

### Decision
Use DynamoDB with UserID as partition key for all entity types:
- `Users` - User profiles and auth data
- `Jobs` - Job postings (global, queryable)
- `Experiences` - User work history (partitioned by userId)
- `Applications` - Job applications (partitioned by userId)

### Consequences
- **Positive:** Efficient user-scoped queries, seamless scaling, serverless-native
- **Negative:** Complex access patterns require careful index design, no transactions across entities

---

## ADR-004: Circuit Breaker Pattern

**Date:** 2024-03-10
**Status:** Accepted

### Context
DynamoDB operations can fail due to throttling or temporary outages. We needed resilience.

### Decision
Implement circuit breaker pattern in `DynamoDBUtil`:
- Track failure rates
- Open circuit after threshold failures
- Half-open state to test recovery
- Automatic fallback to cached responses

### Consequences
- **Positive:** Graceful degradation, prevents cascade failures, improved reliability
- **Negative:** Added complexity, potential for stale data in cache

---

## ADR-005: Amplify DataStore for Mobile Offline Support

**Date:** 2024-11-20
**Status:** Accepted

### Context
Mobile users need offline access to critical data like job applications and experiences.

### Decision
Use AWS Amplify DataStore with:
- Local SQLite storage
- Background sync to cloud
- Conflict resolution strategy (last-write-wins with user notification)
- Sync status indicators in UI

### Consequences
- **Positive:** Offline-first experience, seamless sync, reduced network dependency
- **Negative:** Conflict resolution complexity, storage sync overhead

---

---

## ADR-006: Agent Sandbox Isolation

**Date:** 2026-03-29
**Status:** Accepted

### Context
AI agents running directly on developer machines could accidentally execute destructive
operations (force-push, deploy to production, rm -rf) without proper gating.

### Decision
Implement two layers of sandbox protection:
1. `.claude/settings.local.json` — Claude Code permission allowlist/denylist for this project
2. `scripts/sandbox-check.sh` — Runtime gate requiring explicit confirmation for destructive ops outside CI

All deployment operations are restricted to CI/CD pipelines. Local agent runs use
`isolation: "worktree"` for significant changes.

### Consequences
- **Positive:** Agents cannot accidentally deploy or destroy data; developers can safely run agents
- **Negative:** Slight friction for intentional local deployments (requires "yes-i-know" confirmation)

---

## ADR-007: Agent Orchestration (Supervisor Pattern)

**Date:** 2026-03-29
**Status:** Accepted

### Context
Complex multi-workstream tasks (>2 parallel concerns, >15 tool calls) executed monolithically
fill the context window and produce lower quality output.

### Decision
Use a Supervisor pattern housed in `.agents/`:
- Primary agent decomposes the task and spawns role-specific sub-agents
- Sub-agents use prompt templates from `.agents/prompts/` (reviewer, test-writer, infrastructure)
- Sub-agents are scoped, sandboxed, and report results back to the primary agent
- Single-Agent System (SAS) for now — no full MAS until warranted by task volume

### Consequences
- **Positive:** Parallel workstreams, protected context, role-specialized output quality
- **Negative:** Coordination overhead for simple tasks (skip orchestration if <3 tool calls)


## ADR-008: Dual Job Data Sources (JSearch + Adzuna)

**Date:** 2026-03-29
**Status:** Accepted

### Context
JSearch (via RapidAPI) has limited coverage outside major US/UK markets. Users in NZ and AU
(Auckland, Wellington, Sydney, etc.) consistently get zero results. Seek dominates NZ/AU job
markets but has no public search API.

### Decision
Run two job providers in parallel inside `searchJobs.ts`:
1. **JSearch** — primary provider for US/UK/global results
2. **Adzuna** — activated when location keywords match NZ or AU city names; Adzuna aggregates
   Seek listings and exposes a free developer API

Adzuna results are placed first in the combined list. Deduplication by
`title.toLowerCase()|company.toLowerCase()` key prevents double entries. Adzuna is
non-fatal: if credentials are absent or the call fails, JSearch-only results are returned.

Credentials stored in AWS SSM: `adzuna-app-id` and `adzuna-app-key`.

### Consequences
- **Positive:** NZ/AU users now see real Seek listings; graceful degradation if Adzuna is unconfigured
- **Negative:** Two external API dependencies; Adzuna free tier rate-limited to 250 req/day

---

## Active Decisions

| ID | Title | Status |
|----|-------|--------|
| ADR-001 | Serverless Architecture | Accepted |
| ADR-002 | Monorepo Structure | Accepted |
| ADR-003 | DynamoDB Single-Table Design | Accepted |
| ADR-004 | Circuit Breaker Pattern | Accepted |
| ADR-005 | Amplify DataStore for Mobile | Accepted |
| ADR-006 | Agent Sandbox Isolation | Accepted |
| ADR-007 | Agent Orchestration (Supervisor Pattern) | Accepted |
| ADR-008 | Dual Job Data Sources (JSearch + Adzuna) | Accepted |

---

## Superseded Decisions

None yet.

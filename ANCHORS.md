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

## Active Decisions

| ID | Title | Status |
|----|-------|--------|
| ADR-001 | Serverless Architecture | Accepted |
| ADR-002 | Monorepo Structure | Accepted |
| ADR-003 | DynamoDB Single-Table Design | Accepted |
| ADR-004 | Circuit Breaker Pattern | Accepted |
| ADR-005 | Amplify DataStore for Mobile | Accepted |

---

## Superseded Decisions

None yet.

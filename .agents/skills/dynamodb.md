---
name: dynamodb
description: DynamoDB access patterns, GSI usage, and single-table design conventions
load-when: Writing DynamoDB queries, adding GSIs, or designing new access patterns
---

## Single-Table Design (ADR-003)

- Partition key: `userId` for all user-scoped entities
- Use entity type prefix in sort key: `JOB#<jobId>`, `APP#<appId>`, `EXP#<expId>`
- Global records (e.g. job listings) use a fixed partition key like `JOBS#GLOBAL`

## Query Patterns

- Always query by partition key first; use sort key prefix for filtering
- Use GSIs for cross-entity lookups (e.g. jobs by company)
- Never scan — scans are cost-prohibitive and slow at scale

## DynamoDBUtil

- Use `DynamoDBUtil` from `shared/src/utils/DynamoDBUtil.ts` for all operations
- It wraps the AWS SDK with the circuit breaker (ADR-004) — do not bypass it
- Methods: `get()`, `put()`, `query()`, `delete()`, `update()`

## Adding a New GSI

1. Define it in `infrastructure/lib/` CDK stack
2. Add the access pattern to this skill file
3. Record the decision in `ANCHORS.md` if it's a new entity or access pattern

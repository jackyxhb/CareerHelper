# Middleware: DynamoDB Circuit Breaker

**Status:** Active (application-level, not a harness middleware)
**Toggle:** Feature flag in `backend/src/utils/DynamoDBUtil.ts`

## What it does
Tracks DynamoDB failure rates. Opens the circuit after threshold failures,
enters half-open state to test recovery, falls back to cached responses.
Defined in ADR-004 (see ANCHORS.md).

## How to disable cleanly
In `DynamoDBUtil.ts`, set `CIRCUIT_BREAKER_ENABLED = false` or remove the
CircuitBreaker wrapper and call DynamoDB directly.

## Why it exists
Prevents cascade failures when DynamoDB is throttling or experiencing
a temporary outage. Graceful degradation over hard failure.

## Warning
Disabling this middleware removes the fallback to cached data. Under DynamoDB
throttling, requests will fail hard instead of degrading gracefully.

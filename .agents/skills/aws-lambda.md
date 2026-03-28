---
name: aws-lambda
description: Conventions for Lambda function handlers, error handling, and API Gateway responses
load-when: Modifying files under backend/functions/ or backend/handlers/
---

## Lambda Handler Conventions

- Every handler must have signature: `export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult>`
- Always return a proper APIGateway response object with `statusCode`, `headers`, and `body`
- Set CORS headers on every response (see existing handlers for the header block)
- Parse `event.body` safely — it can be null; always guard with `JSON.parse(event.body ?? '{}')`

## Error Handling

- Catch all errors and return HTTP 500 with a sanitized message (never leak stack traces)
- Log the full error with `console.error` before returning the sanitized response
- Use the circuit breaker in `DynamoDBUtil` for all DynamoDB operations (see ADR-004)

## Auth

- Extract `userId` from `event.requestContext.authorizer.claims.sub` (Cognito JWT)
- Never trust userId from the request body — always use the Cognito claim

## Testing

- Mock `@aws-sdk/client-dynamodb` with `jest.mock()`
- Test happy path, missing auth, and DynamoDB error path for every handler

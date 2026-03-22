# Code Review Checklist

> For human reviewers. AI agents should use this as guidance for self-review.

---

## General

- [ ] Code follows project conventions (see `CLAUDE.md`)
- [ ] No debug code or console.log statements
- [ ] Error handling is appropriate
- [ ] No hardcoded secrets or credentials

## Backend (Lambda Functions)

- [ ] Input validation is present
- [ ] Responses follow consistent format
- [ ] DynamoDB operations use circuit breaker
- [ ] Logging is structured (JSON format)
- [ ] No synchronous operations that could block

## Frontend (React/Web/React Native)

- [ ] Components are properly typed
- [ ] No prop drilling beyond 2 levels
- [ ] Loading/error states handled
- [ ] Responsive design considered
- [ ] Accessibility basics (labels, contrast)

## Testing

- [ ] Unit tests cover core logic
- [ ] Test coverage ≥80%
- [ ] Tests are deterministic
- [ ] AWS SDK properly mocked

## Documentation

- [ ] Complex logic has comments
- [ ] Public APIs are documented
- [ ] README updated if needed
- [ ] CHANGELOG entry for user-facing changes

## Performance

- [ ] No N+1 query patterns
- [ ] Lazy loading used where appropriate
- [ ] Bundle size considered
- [ ] No memory leaks in long-running operations

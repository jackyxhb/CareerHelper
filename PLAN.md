# Task Plan

> Fill this in before starting any task requiring >3 tool calls.
> Append a Session Log entry before ending each session.

---

## Task: [Replace with your task name]

**Created:** [YYYY-MM-DD]
**Status:** In Progress | Blocked | Complete
**Branch:** feature/[branch-name]
**Max Loop Budget:** 5 sessions (escalate to human if exceeded)

---

## Objective

[One paragraph: what this task achieves and why it matters]

---

## Progress

### What's Been Done
- [ ] [Step completed]

### What's Next
- [ ] [Next step]
- [ ] [Following step]

### Blockers
- None

---

## Files Modified
- [file path]

## Files to Review
- [file path]

---

## Session Log

### [YYYY-MM-DD] — Session 1
- **Action:** [What was accomplished]
- **Files changed:** [List]
- **Next steps:** [Exactly where to resume]

---

## Completion Criteria

- [ ] All tests passing (`yarn test`)
- [ ] Lint clean (`yarn lint`)
- [ ] PR opened and AI review passed

---

## Example (delete when using)

```
## Task: Add job application status filtering

Created: 2026-03-29
Status: In Progress
Branch: feature/application-status-filter

Objective:
Allow users to filter their job applications by status (Applied, Interview, Offer, Rejected).
Required by product spec v2.3. Backend endpoint exists; need frontend filter UI + shared types.

Progress:
What's Been Done:
  [x] Added FilterStatus enum to shared/src/types.ts
  [x] Updated ApplicationsAPI.list() to accept status param
What's Next:
  [ ] Add filter dropdown to web/src/pages/Applications.tsx
  [ ] Add filter to mobile/src/screens/ApplicationsScreen.tsx
  [ ] Write tests for filter logic

Session Log:
2026-03-29 — Session 1
  Action: Added shared types and updated backend handler
  Files changed: shared/src/types.ts, backend/functions/applications.ts
  Next steps: Start web filter UI at web/src/pages/Applications.tsx line 42
```

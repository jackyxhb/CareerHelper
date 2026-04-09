# Task Plan

> Fill this in before starting any task requiring >3 tool calls.
> Append a Session Log entry before ending each session.

---

## Task: Test harness injection protocol on CareerHelper

**Created:** 2026-04-09
**Status:** In Progress
**Branch:** agent/harness-audit/protocol-test
**Max Loop Budget:** 5 sessions (escalate to human if exceeded)

---

## Objective

Run a guide-backed harness audit against CareerHelper using the new harness-injection protocol draft from HELab. The goal is to classify the repo's slot surfaces, test whether the protocol gives a useful and safe audit sequence on a second real target repository, and produce `.harness/` audit artifacts without disturbing live delivery behavior.

---

## Progress

### What's Been Done
- [x] Read CareerHelper's agent instructions, harness notes, anchors, and verification script
- [x] Identified the initial touch-point classes: planning (`PLAN.md`), contract (`CLAUDE.md`, `HARNESS.md`, `ANCHORS.md`), verification (`scripts/verify-changes.sh`, GitHub workflows), orchestration (`.agents/`), and volatile/local state (none active yet)
- [x] Wrote fresh `.harness/` audit artifacts using the harness-injection protocol as the classification lens
- [x] Reclassified the repo as stronger than its older root-level HE audit, especially on sandboxing, MCP, orchestration, and automated review surfaces

### What's Next
- [ ] Decide whether to approve any Tier 1 follow-on batch from `.harness/HE-IMPLEMENTATION-PLAN.md`
- [ ] If a batch is approved, retarget CareerHelper's live planning and verification surfaces only for that batch
- [ ] Otherwise leave the test at audit-only and carry the findings back to HELab as additional protocol evidence

### Blockers
- None

---

## Files Modified
- PLAN.md
- .harness/HE-SCOPE.md
- .harness/HE-CLUES.md
- .harness/HE-PRIORITIES.md
- .harness/HE-IMPLEMENTATION-PLAN.md

## Files to Review
- .harness/HE-SCOPE.md
- .harness/HE-CLUES.md
- .harness/HE-PRIORITIES.md
- .harness/HE-IMPLEMENTATION-PLAN.md

---

## Session Log

### [2026-04-09] — Session 1
- **Action:** Established an isolated audit branch, read the CareerHelper harness surfaces, and activated this required plan before creating any `.harness/` outputs.
- **Files changed:** PLAN.md
- **Next steps:** Create the `.harness/` audit outputs, classify slot/touch-point surfaces, and decide whether the protocol yields a safe remediation sequence for this repo.

### [2026-04-09] — Session 2
- **Action:** Wrote fresh `.harness/` audit artifacts and used the harness-injection protocol to separate safe staging surfaces from live operational surfaces. Identified Tier 1 gaps as requirements ledger, intake gating, and durable review evidence.
- **Files changed:** PLAN.md, .harness/HE-SCOPE.md, .harness/HE-CLUES.md, .harness/HE-PRIORITIES.md, .harness/HE-IMPLEMENTATION-PLAN.md
- **Next steps:** Present the protocol-test findings and get approval before mutating CareerHelper's live operational surfaces.

---

## Completion Criteria

- [ ] Audit artifacts written under `.harness/`
- [ ] Findings summarized with slot/touch-point classification
- [ ] If code or config changes are proposed, verification requirements are identified before execution

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

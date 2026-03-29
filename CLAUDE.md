# CareerHelper — Agent Instructions

This file provides context and instructions for AI agents working on the CareerHelper project.

## Project Overview

CareerHelper is a comprehensive career management platform built as a monorepo with:
- **Backend**: Serverless AWS Lambda functions (Node.js)
- **Web**: React application with AWS Amplify
- **Mobile**: React Native application
- **Shared**: TypeScript utilities and types
- **Infrastructure**: AWS CDK

## Architecture

```
CareerHelper/
├── backend/          # Lambda functions, utilities, tests
├── web/              # React web app
├── mobile/           # React Native mobile app
├── shared/           # Shared TypeScript code
├── infrastructure/   # AWS CDK stack
├── docs/             # API documentation
└── scripts/          # Automation scripts
```

## Data Models

- **Users**: User profiles and authentication data
- **Jobs**: Job postings with company, location, salary details
- **Experiences**: Work history, skills, education (partitioned by userId)
- **Applications**: Job applications with status tracking (partitioned by userId)

## Key Technologies

| Component | Technology |
|-----------|------------|
| Backend | AWS Lambda, API Gateway, DynamoDB, Cognito, S3 |
| Web | React 18, AWS Amplify, Material-UI, React Router |
| Mobile | React Native, Amplify DataStore, React Navigation |
| Auth | AWS Cognito |
| IaC | AWS CDK |

## Commands

### Installation
```bash
yarn install:all          # Install all workspace dependencies
```

### Development
```bash
yarn build                # Build all workspaces
yarn start:web            # Start web app (http://localhost:3000)
yarn start:mobile         # Start mobile app
```

### Testing & Quality
```bash
yarn test                 # Run all tests
yarn test:coverage        # Run tests with coverage
yarn lint                 # Run ESLint
yarn lint:fix             # Fix ESLint issues
yarn format               # Format with Prettier
yarn verify               # Run lint + tests (pre-commit hook)
```

### Deployment
```bash
yarn deploy:backend       # Deploy Lambda functions
yarn deploy:web           # Deploy web to S3
yarn deploy:mobile        # Deploy mobile with Amplify
```

## Coding Conventions

### TypeScript
- Strict type checking enabled
- Avoid `any` type; use `unknown` or proper types
- Use explicit function return types where helpful
- Prefix unused parameters with `_`

### Code Style
- ESLint + Prettier enforced
- Single quotes, semicolons, trailing commas (es5)
- 80-character line width

### Testing
- Jest for all workspaces
- Minimum 80% code coverage
- Mock AWS SDK for unit tests

## Git Workflow

1. Create feature branch: `git checkout -b feature/description`
2. Make changes and verify: `yarn verify`
3. Commit with clear message (see convention below)
4. Push and create PR

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<slug>` | `feature/application-status-filter` |
| Bug fix | `fix/<slug>` | `fix/dynamo-timeout-on-cold-start` |
| Agent sub-task | `agent/<objective>/<sub-task>` | `agent/auth-refactor/add-cognito-jwks` |
| Infra change | `infra/<slug>` | `infra/add-jobs-gsi` |

For objectives spanning >2 sessions, use `agent/` branches: one branch per workstream,
each holding its own scope of commits. The primary agent merges them when done.

### Commit Message Convention

Commits are cognitive memory — write what was decided and why, not just what changed.

```
<type>: <short summary>

[Optional body explaining the decision rationale — especially for architectural choices]
```

Types: `feat` · `fix` · `refactor` · `test` · `docs` · `infra` · `chore`

Good: `feat: add status filter to applications API — chosen over client-side filter to reduce transfer size`
Bad: `update stuff`

Any commit touching architecture, data models, or cross-workspace boundaries should
reference the relevant ADR from `ANCHORS.md` in the body.

### Consolidation Rule

Any PR that changes architecture, commands, data models, or Lambda signatures **must**
include an update to `CLAUDE.md` or `ANCHORS.md`. The `meta-sync.yml` workflow will
flag PRs that miss this.

## Planning & State (Mandatory)

**PLAN.md is required for any task requiring more than 3 tool calls.**

Do not begin implementation without first writing an active `PLAN.md`. The template
already exists — fill it in with the real task name, objective, and first steps.

## Long Task Handling (Ralph Loops)

For tasks spanning multiple sessions:

1. **Checkpoint Progress**: Before ending a session, append to `PLAN.md` Session Log:
   - What was accomplished this session
   - What is next
   - Files modified

2. **Resume Protocol**: At session start:
   - Read `PLAN.md` — resume from last checkpoint
   - Read `ANCHORS.md` for architectural decisions
   - Do not re-read files already summarized in PLAN.md

3. **Context Compaction**: At every major phase boundary:
   - Write findings summary to `PLAN.md` or `.agents/logs/`
   - Flush raw file contents from active thinking
   - Carry forward only the compiled summary

4. **Incomplete Detection**: If a task feels unfinished:
   - Declare what remains explicitly
   - Write next steps to `PLAN.md`
   - Suggest "TODO: Continue..." in final message

5. **Max Loop Budget**: If a task spans >5 sessions without completing — escalate to human.

## Sandbox Protocol

Before any deployment or destructive operation, run:
```bash
bash scripts/sandbox-check.sh "<operation>"
```

Destructive operations that must only run in CI (never locally without confirmation):
- `serverless deploy` / `amplify publish` / `cdk deploy`
- `aws s3 sync` or any `aws` CLI write command
- `git push --force` / `git reset --hard`
- `rm -rf`

For tasks touching infrastructure or involving significant file changes, use
Claude Code's `isolation: "worktree"` mode to work in a throwaway branch.

## Orchestration

When a task spans >2 workstreams or requires >15 expected tool calls, decompose
into sub-agents using the templates in `.agents/prompts/`:

| Template | Use When |
|----------|----------|
| `.agents/prompts/reviewer.md` | Code review before PR |
| `.agents/prompts/test-writer.md` | Coverage gap or new logic without tests |
| `.agents/prompts/infrastructure.md` | CDK / serverless.yml changes |

See `.agents/README.md` for the full supervisor pattern protocol.

## MCP Tools

MCP servers are registered in `.mcp.json`. Approve them on first launch when Claude Code prompts.

| Server | Use When |
|--------|----------|
| `brave-search` | Looking up libraries, AWS docs, error messages, or anything beyond model knowledge cutoff |
| `github` | Querying PR status, issues, or CI runs without leaving the agent session |

**Required env vars** (set in shell profile or CI secrets):
- `BRAVE_API_KEY` — Brave Search API key
- `GITHUB_TOKEN` — GitHub personal access token with `repo` + `workflow` scopes

**AWS SSM parameters** (required for full job search coverage):
- `adzuna-app-id` — Adzuna API app ID (NZ/AU job search via Seek aggregation)
- `adzuna-app-key` — Adzuna API app key
  Register at developer.adzuna.com. Without these, NZ/AU searches fall back to JSearch only.

## Middleware Layers

Each toggleable layer is documented in `.agents/middleware/`. Disable cleanly — do not hardcode bypasses.

| Layer | Config Location | Toggle |
|-------|----------------|--------|
| Husky pre-commit | `package.json` husky block | `HUSKY=0` or remove block |
| lint-staged | `package.json` lint-staged block | Remove block |
| dependency-cruiser | `.dependency-cruiser.json` | Remove file or CI step |
| DynamoDB circuit breaker | `backend/src/utils/DynamoDBUtil.ts` | Feature flag in code |

## Tool Output Protocol

When a tool returns >50 lines of output:
1. Save full output to `.agents/logs/YYYY-MM-DD-<task-slug>.log`
2. Pass only a 5-line summary forward in active context
3. Reference the log file path if detail is needed later

## Escalation Triggers

Escalate to human when:
- Task requires AWS credentials or secrets
- Deployments to production
- Circular dependencies or architectural conflicts
- Task exceeds 10 tool calls without resolution
- Uncertainty about business logic or requirements

## Architectural Decisions

See `ANCHORS.md` for documented decisions including:
- Why serverless architecture was chosen
- Monorepo structure rationale
- Key design patterns (circuit breaker, etc.)

## Critical Files

| File | Purpose |
|------|---------|
| `serverless.yml` | Backend API definition |
| `backend/serverless.yml` | Lambda function handlers |
| `infrastructure/lib/` | CDK infrastructure code |
| `shared/src/` | TypeScript interfaces |
| `web/src/` | React components |
| `mobile/src/` | React Native screens |

## Quality Gates

All PRs must pass:
- [ ] ESLint (no errors)
- [ ] Prettier (proper formatting)
- [ ] Tests (all passing)
- [ ] TypeScript compilation (no errors)
- [ ] AI code review (`.github/workflows/ai-review.yml`) — no CRITICAL issues

Run `yarn verify` locally before pushing.

The AI review workflow posts a comment on every PR. It blocks merge on CRITICAL findings
(architecture violations, hardcoded secrets, missing tests for new logic).
Requires `ANTHROPIC_API_KEY` secret in GitHub repository settings.

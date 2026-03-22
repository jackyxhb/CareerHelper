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
3. Commit with clear message: `git commit -m 'Add feature description'`
4. Push and create PR

## Long Task Handling (Ralph Loops)

For tasks spanning multiple sessions:

1. **Checkpoint Progress**: Before ending a session, write current state to `PLAN.md`:
   - What's been done
   - What's next
   - Files modified

2. **Resume Protocol**: At session start:
   - Read `PLAN.md` if exists
   - Read `ANCHORS.md` for architectural decisions
   - Continue from last checkpoint

3. **Incomplete Detection**: If a task feels unfinished:
   - Declare what remains explicitly
   - Write next steps to `PLAN.md`
   - Suggest "TODO: Continue..." in final message

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

Run `yarn verify` locally before pushing.

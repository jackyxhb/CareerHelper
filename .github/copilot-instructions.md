# GitHub Copilot Instructions for CareerHelper

## Project Overview
CareerHelper is a comprehensive career management platform built as a monorepo with serverless AWS backend, React web app, and React Native mobile app. It manages job opportunities, work experiences, and job applications using AWS services for scalability and security.

## Architecture
- **Backend**: Serverless microservices using AWS Lambda (Node.js/Python), API Gateway, DynamoDB, Cognito for auth, S3 for storage.
- **Web Frontend**: React.js with AWS Amplify for hosting, auth, and API integration.
- **Mobile**: React Native with Amplify for cross-platform iOS/Android support.
- **Shared**: Common TypeScript interfaces and utilities in `/shared`.
- **Infrastructure**: AWS CDK for provisioning resources.

Key data models: `Users`, `Jobs`, `Experiences`, `Applications` in DynamoDB with UserID as partition key.

## Development Workflow
- **Setup**: Use `yarn workspaces` for monorepo management.
- **Backend Deploy**: `sls deploy` with `serverless.yml`.
- **Frontend Deploy**: `amplify push` for web/mobile.
- **Infra**: `cdk deploy` from `/infrastructure`.
- **CI/CD**: GitHub Actions for automated deployment.

## Coding Patterns
- **Authentication**: Always integrate Cognito for user auth; use Amplify Auth components.
- **API Calls**: Backend uses AWS SDK; frontend uses Amplify API with GraphQL/REST.
- **Data Storage**: DynamoDB with serverless functions; S3 for file uploads.
- **Error Handling**: Log to CloudWatch; implement input validation and rate limiting.
- **Styling**: Material-UI or Tailwind for web; React Native components for mobile.

## Key Files
- `instructions.md`: Detailed blueprint for building the platform.
- `/backend/serverless.yml`: Defines Lambda functions and API endpoints.
- `/web/src/`: React components (e.g., Dashboard, JobSearch).
- `/mobile/src/`: React Native screens (e.g., ExperienceBuilder).
- `/shared/`: TypeScript types like `interface Job { id: string; title: string; ... }`.

## Conventions
- Microservices: Separate Lambda functions for jobs, experiences, applications.
- Security: HTTPS, encrypted data, GDPR compliance.
- Testing: Jest for frontend, Mocha for backend.
- Documentation: OpenAPI specs in `/docs`.

Follow `instructions.md` for step-by-step implementation. Prioritize serverless-first, secure-by-default design.
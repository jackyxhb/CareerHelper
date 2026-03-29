# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- `backend/test/searchJobs.test.js` — 23 tests covering pure functions (`detectAdzunaCountry`, `deduplicateJobs`, `sanitizeForRetry`, `normalizeJSearchJob`, `normalizeAdzunaJob`) and handler integration (400 validation, JSearch results, Adzuna merge, dedup, retry, `providersWarning`)
- `backend/test/secrets.test.js` — 7 tests for `SecretsManager.getAdzunaCredentials` using `aws-sdk-client-mock` (happy path, ParameterNotFound, SSM error, empty appId, stage path, caching, clearCache)
- `backend/.mocharc.yml` — mocha glob config so `test/**/*.test.js` discovery works in non-interactive shells

### Changed
- `searchJobs.ts`: replace `any` with typed `JSearchJobRaw`, `JSearchResponse`, `AdzunaJobRaw`, `AdzunaResponse` interfaces; add `sanitizeForRetry()` to strip special chars before retry query; track `jSearchFailed` flag; expose `providersWarning` in response when all providers fail
- `secrets.ts`: differentiate ParameterNotFound (log INFO) from unexpected SSM errors (log WARN) in `getAdzunaCredentials`
- `backend/test/createUser.test.js`: rewrite with `aws-sdk-client-mock` on `DynamoDBDocumentClient`; fixes pre-existing failure caused by proxyquire not handling TS default exports; adds 409 conflict case
- `backend/test/getUser.test.js`: rewrite with `aws-sdk-client-mock` on `DynamoDBDocumentClient`; fixes pre-existing failure
- `backend/package.json`: simplify `test`/`test:coverage` scripts to delegate spec glob to `.mocharc.yml`

### Fixed
- N/A

## [0.0.3] - 2026-03-29

### Added
- **Adzuna/Seek Integration**: NZ and AU job search coverage via Adzuna API (aggregates Seek); configurable via `adzuna-app-id` and `adzuna-app-key` SSM parameters
- **Debounced Auto-Search**: Job search fires automatically after 2+ characters with 400ms debounce
- **Location Relevance Sorting**: Client-side sort puts exact-location matches first, remote second
- **Contextual Empty States**: Explains limited NZ/AU coverage when location filter active; friendly prompt before first search
- **AI Resume Tailoring**: Paste resume and job description for personalized suggestions
- **Analytics Instrumentation**: Track user events across web and mobile
- **Error Boundaries**: Graceful error handling with retry options
- **Onboarding Flow**: 4-step guided onboarding for new users
- **PMF Survey**: Sean Ellis-style product-market fit measurement

### Changed
- UI modernization: polished design system with stat cards, badge system, grid layouts
- Job Search: "Find Jobs" button now correctly triggers search (was missing onClick)
- ApplicationTracker: rewritten using design system classes; parallel API fetch
- Navigation: switched to NavLink with active tab highlighting

### Fixed
- CI: upgrade Node.js 18 → 20 (required by eslint-visitor-keys@5)
- CI: replace Yarn 2 `workspaces foreach` with Yarn 1 `workspace <name>` syntax
- CI: hoist `ts-node` to root devDependencies so mocha can resolve it
- CI: add missing `test:coverage` script to web workspace
- ESLint: disable core `no-unused-vars` for TypeScript files; fix unused imports and exports

## [0.0.2] - 2025-12-09

### Added
- Resume upload pipeline with Cognito-authorized signed URLs
- DynamoDB metadata for resume management
- Web application updates for resume management
- Mobile offline-first experience with Amplify DataStore
- CDK-managed S3 CORS rules
- Documentation refresh

### Changed
- Improved job snapshot persistence
- Enhanced authorization headers

## [0.0.1] - 2025-12-07

### Added
- Initial release
- Serverless backend with 8 Lambda functions
- React web application
- React Native mobile app
- AWS CDK infrastructure
- GitHub Actions CI/CD
- Basic unit tests

[Unreleased]: https://github.com/jackyxhb/CareerHelper/compare/v0.0.3...HEAD
[0.0.3]: https://github.com/jackyxhb/CareerHelper/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/jackyxhb/CareerHelper/releases/tag/v0.0.2
[0.0.1]: https://github.com/jackyxhb/CareerHelper/releases/tag/v0.0.1

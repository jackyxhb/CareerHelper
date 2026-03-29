# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [0.0.6] - 2026-03-30

### Added
- **Complete Frontend Design Redesign**: All page components refactored to use consistent modern design system

### Changed
- **AnalyticsPage.js**: Converted from old analytics-page/section-header/dashboard-card structure to `.page-container`, `.page-header`, `.card`; added loading spinner, improved error state, styled data table with CSS variables
- **ResumeManager.js**: Modernized upload zone with dashed border and emoji icon; resume list as styled cards with inline actions; consistent empty states
- **ResumeTailor.js**: **Removed 180 lines of inline styles** — converted to design system; form uses 2-column grid layout; results display score circle (dynamic color), sections, keywords, suggestions all using `--space-*`, `--color-*`, `--radius` variables
- **JobSearch.js**: Improved search form layout with 2-column grid (Job Title, Location); full-width search button for better mobile UX
- **ApplicationTracker.js**: Simplified page header, consistent card-based layout for saved/applied job cards
- **ProfileSettings.js**: Country/City fields converted to 2-column grid; Save button enhanced with emoji and `.btn-lg` sizing
- **ExperienceManager.js**: Modern card-based form (previous session), experience list as individual cards with date badges
- **Dashboard.js**: Redesigned stat cards to split applications into saved/applied counts (previous session), improved empty states with actionable buttons

### Result
- **All pages now follow consistent design system**: `.page-container` → `.page-header` → `.card` hierarchy
- **Unified styling approach**: CSS variable spacing (`--space-4`, `--space-6`), colors (`--color-*`), and typography
- **Better mobile responsiveness**: 2-column grids convert to single column on smaller screens
- **Improved accessibility**: Form labels, disabled states, loading spinners throughout

## [0.0.5] - 2026-03-30

### Added
- **SAVED vs APPLIED Job State Distinction**: Two distinct application states across system
  - SAVED: jobs bookmarked for later review/application (new state)
  - APPLIED: submitted applications with status tracking (existing statuses APPLIED, INTERVIEWING, OFFERED, REJECTED, WITHDRAWN)
- **`updateApplication` Lambda** (`PUT /applications/{userId}/{applicationId}`): transitions SAVED→APPLIED with state guard — rejects attempts to revert from terminal statuses back to SAVED; optional `notes` field for cover letter/application details
- **`deleteApplication` Lambda** (`DELETE /applications/{userId}/{applicationId}`): removes applications from tracker with 404 handling
- **Application Tabs in Tracker**: Saved/Applied tabs split by status; Saved tab shows "Apply" + "Remove" per card; Applied tab shows "Delete" with inline confirmation
- **Inline Apply Workflow**: Position-fixed modal overlay with textarea for optional cover letter notes; SAVED→APPLIED transition on submit; auto-switches to Applied tab
- **Job State Awareness in JobSearch**: Per-card badges show "✓ Applied" (terminal, no action), "✓ Saved" + Unsave button, or Save button based on application status Map
- `backend/test/updateApplication.test.js` — 6 tests (SAVED→APPLIED, 404, 400 guard, missing status, missing userId, notes field)
- `backend/test/deleteApplication.test.js` — 5 tests (successful delete, 404, missing userId, missing applicationId, DynamoDB error)

### Changed
- **JobSearch.js**: Added natural key helper `(jobTitle|jobCompany|jobLocation)`, `savedAppsMap` state, `fetchApplications()` on mount, per-card state rendering with Save/Unsave/Applied logic
- **ApplicationTracker.js**: Restructured with `activeTab` state (Saved/Applied), split applications by status, new handlers `handleApplyFromTracker()` and `handleDelete()`, modal and confirmation dialogs using position:fixed pattern
- **getApplications.ts**: Prettier formatting (line length optimization)

### Fixed
- Application deduplication now fully integrated across system (natural key: jobTitle|jobCompany|jobLocation)

## [0.0.4] - 2026-03-29

### Added
- **User Profile Settings**: `/profile` route with `ProfileSettings` component — edit preferred display name, city/country (linked dropdowns), and job role preferences (tag-style input with one-click suggestions)
- **`PUT /users/{userId}` — `updateUser` Lambda**: persists `preferredName`, `city`, `country`, `jobPreferences` to DynamoDB using `UpdateExpression`; validates field types; 404 if user not found; 5 new tests (success, partial update, 404, 400 invalid type, 400 missing body)
- `backend/test/searchJobs.test.js` — 23 tests covering pure functions (`detectAdzunaCountry`, `deduplicateJobs`, `sanitizeForRetry`, `normalizeJSearchJob`, `normalizeAdzunaJob`) and handler integration (400 validation, JSearch results, Adzuna merge, dedup, retry, `providersWarning`)
- `backend/test/secrets.test.js` — 7 tests for `SecretsManager.getAdzunaCredentials` using `aws-sdk-client-mock` (happy path, ParameterNotFound, SSM error, empty appId, stage path, caching, clearCache)
- `backend/.mocharc.yml` — mocha glob config so `test/**/*.test.js` discovery works in non-interactive shells

### Changed
- **Job Search pre-fill**: `JobSearch` seeds query and location fields from profile preferences on mount and on async profile arrival; functional updater ensures user-typed values are never overwritten
- **City/country dropdowns**: `ProfileSettings` uses linked `CITIES_BY_COUNTRY` map — city resets when country changes; city selector disabled until country is chosen
- `searchJobs.ts`: replace `any` with typed `JSearchJobRaw`, `JSearchResponse`, `AdzunaJobRaw`, `AdzunaResponse` interfaces; add `sanitizeForRetry()` to strip special chars before retry query; track `jSearchFailed` flag; expose `providersWarning` in response when all providers fail
- `secrets.ts`: differentiate ParameterNotFound (log INFO) from unexpected SSM errors (log WARN) in `getAdzunaCredentials`
- `backend/test/createUser.test.js`: rewrite with `aws-sdk-client-mock` on `DynamoDBDocumentClient`; fixes pre-existing failure caused by proxyquire not handling TS default exports; adds 409 conflict case
- `backend/test/getUser.test.js`: rewrite with `aws-sdk-client-mock` on `DynamoDBDocumentClient`; fixes pre-existing failure
- `backend/package.json`: simplify `test`/`test:coverage` scripts to delegate spec glob to `.mocharc.yml`

### Fixed
- Profile save was silently failing — `updateUser` Lambda existed in code but had never been deployed; backend redeployed (52 tests passing)

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

[Unreleased]: https://github.com/jackyxhb/CareerHelper/compare/v0.0.5...HEAD
[0.0.5]: https://github.com/jackyxhb/CareerHelper/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/jackyxhb/CareerHelper/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/jackyxhb/CareerHelper/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/jackyxhb/CareerHelper/releases/tag/v0.0.2
[0.0.1]: https://github.com/jackyxhb/CareerHelper/releases/tag/v0.0.1

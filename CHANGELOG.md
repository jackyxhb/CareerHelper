# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- **AI Resume Tailoring**: Paste resume and job description for personalized suggestions
- **Analytics Instrumentation**: Track user events across web and mobile
- **Error Boundaries**: Graceful error handling with retry options
- **Onboarding Flow**: 4-step guided onboarding for new users
- **PMF Survey**: Sean Ellis-style product-market fit measurement
- **TestFlight Beta Guide**: Documentation for iOS beta distribution
- **Play Store Beta Guide**: Documentation for Android beta distribution

### Changed
- Updated navigation to include AI Resume Tailor
- Improved error handling across all components

### Fixed
- N/A

### Removed
- N/A

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

[Unreleased]: https://github.com/jackyxhb/CareerHelper/compare/v0.0.2...HEAD
[0.0.2]: https://github.com/jackyxhb/CareerHelper/releases/tag/v0.0.2
[0.0.1]: https://github.com/jackyxhb/CareerHelper/releases/tag/v0.0.1

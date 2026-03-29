# CareerHelper

[![CI/CD](https://github.com/jackyxhb/CareerHelper/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/jackyxhb/CareerHelper/actions/workflows/ci-cd.yml)
[![Test Coverage](https://img.shields.io/codecov/c/github/jackyxhb/CareerHelper)](https://codecov.io/gh/jackyxhb/CareerHelper)
[![Tests](https://img.shields.io/github/actions/workflow/status/jackyxhb/CareerHelper/test.yml?label=tests)](https://github.com/jackyxhb/CareerHelper/actions/workflows/test.yml)
[![Release](https://img.shields.io/github/v/release/jackyxhb/CareerHelper)](https://github.com/jackyxhb/CareerHelper/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A comprehensive career management platform built as a monorepo with serverless AWS backend, React web app, and React Native mobile app. CareerHelper empowers job seekers and professionals to manage their entire career lifecycle through intelligent tracking, personalized recommendations, and seamless cross-platform experience.

## 📊 Project Status

✅ **Backend**: 19 Lambda functions covering users, jobs, experiences, applications, resumes, search, analytics, and application state management
✅ **Web App**: Full React application deployed to AWS S3 with Cognito auth — **complete design system redesign**
✅ **Mobile App**: React Native app with cross-platform support and offline sync
✅ **Infrastructure**: AWS CDK stack with DynamoDB, Cognito, S3 + configured CORS
✅ **Testing**: 63 unit tests with AWS SDK v3 mocking (Mocha + Chai + aws-sdk-client-mock)
✅ **CI/CD**: GitHub Actions workflows for automated deployment
✅ **Documentation**: API specs and development guidelines
✅ **Resume Uploads**: Cognito-protected signed URLs backed by DynamoDB metadata
✅ **Error Handling**: Enterprise-grade resilience with circuit breakers and structured logging
✅ **Profile Settings**: Preferred name, location, and job role preferences with persistent storage
✅ **Job Search**: Adzuna/Seek integration (NZ/AU), debounced auto-search, profile pre-fill
✅ **Application State Machine**: SAVED (bookmarked) vs APPLIED (submitted) with one-way transitions
✅ **UI/UX**: Modern, consistent design system across all pages — grid layouts, CSS variables, accessibility
✅ **Release**: v0.0.6 published with complete frontend redesign

**🎉 Officially released as v0.0.6 - Complete Frontend Design Overhaul!**

#### 🌐 Live Demo
- **Web App**: http://careerhelper-web-dev-1765124463.s3-website-us-east-1.amazonaws.com
- **API**: https://lm5lnut0n5.execute-api.us-east-1.amazonaws.com

## 📦 Latest Release

### [v0.0.6](https://github.com/jackyxhb/CareerHelper/releases/tag/v0.0.6) - Complete Frontend Design Overhaul

**Released**: March 30, 2026

#### 🎉 Highlights
- **Unified Design System**: All 8 page components redesigned with consistent `.page-container` → `.page-header` → `.card` hierarchy
- **Modern Grid Layouts**: 2-column responsive grids for forms (title/company, dates, job fields); single-column fallback on mobile
- **CSS Variables Everywhere**: Removed 180+ lines of inline styles from ResumeTailor; all spacing (`--space-*`), colors (`--color-*`), borders (`--radius`), typography now centralized
- **Improved Analytics Page**: Loading spinner, error states, styled data table
- **Enhanced Resume Manager**: Dashed border upload zone, emoji icons, clean resume list cards
- **Better JobSearch**: 2-column search form, full-width find button
- **Consistent Empty States**: Icon + title + text + actionable buttons across all pages
- **Accessibility**: Proper form labels, disabled states, loading indicators throughout

### [v0.0.5](https://github.com/jackyxhb/CareerHelper/releases/tag/v0.0.5) - SAVED vs APPLIED Job State Distinction

**Released**: March 30, 2026

#### 🎉 Highlights
- **Two distinct job states**: SAVED (bookmarked for later) vs APPLIED (submitted applications)
- **Application state machine**: SAVED→APPLIED one-way transition with guard against reverting from terminal statuses
- **Tabs in Application Tracker**: Split Saved and Applied jobs; Saved jobs show Apply + Remove; Applied show Delete with confirmation
- **Inline apply workflow**: Modal overlay with optional cover letter notes field; auto-transitions to Applied tab on submit
- **Job state awareness in search**: Per-card badges show ✓ Applied (read-only), ✓ Saved (with Unsave), or Save button based on status Map
- New Lambdas: `updateApplication` (PUT, state transitions) and `deleteApplication` (DELETE); 11 new tests (63 total)

#### 📥 Installation Options
```bash
# Install latest release
git clone https://github.com/jackyxhb/CareerHelper.git
cd CareerHelper
git checkout v0.0.5

# Or download from releases
# https://github.com/jackyxhb/CareerHelper/releases/latest
```

## 🌟 Features

### **Job Opportunity Management**
- **Advanced Job Search**: Filter by location, salary, company, and keywords; debounced auto-search with 400ms delay
- **Adzuna/Seek Integration**: NZ and AU job coverage via Adzuna API (aggregates Seek); configurable via SSM
- **Profile Pre-fill**: Job search query and location automatically seeded from saved profile preferences
- **Location Relevance Sorting**: Exact-location matches ranked first, remote second
- **Save & Review**: Bookmark (SAVED state) interesting positions for later review without commitment
- **Apply Workflow**: Click to apply from search or Saved tab; optional cover letter entry with inline modal
- **Job Deduplication**: Natural key (jobTitle|jobCompany|jobLocation) prevents duplicate saves across searches
- **Resume Handoff**: Issue pre-signed upload links tied to each job application

### **Experience Management**
- **Work History Tracking**: Log positions, responsibilities, and achievements
- **Skills Assessment**: Track technical and soft skills with proficiency levels
- **Education Records**: Maintain academic credentials and certifications
- **Resume Generation**: Auto-generate professional resumes from your data

### **Application Tracking**
- **Dual State System**: SAVED (bookmarked jobs) vs APPLIED (submitted applications) with one-way state transitions
- **Saved Jobs Tab**: Bookmark interesting positions; click Apply to start formal application with optional cover letter
- **Applied Jobs Tab**: Track submitted applications with status (Applied, Interviewing, Offered, Rejected, Withdrawn); delete with confirmation
- **Inline Apply Workflow**: Position-fixed modal for cover letter entry; seamless transition from Saved to Applied state
- **Job State Awareness**: Search results show ✓ Applied (read-only badge), ✓ Saved (with Unsave button), or Save button per job
- **Interview Scheduling**: Set reminders for interviews and follow-ups
- **Progress Analytics**: Visualize application success rates and trends
- **Job Snapshot History**: Each saved application retains job title, company, and source even after listings expire

### **Resume Management**
- **Secure Uploads**: Cognito-authenticated signed URLs with S3-managed encryption
- **Resume Library**: Centralized view, download, and deletion of stored resumes
- **Automatic Linking**: Latest resume key synced to the user profile for downstream workflows

### **User Profile**
- **Preferred Name**: Set a display name separate from the Cognito account name
- **Location Preferences**: City/country linked dropdowns — city list scoped to selected country
- **Job Role Preferences**: Tag-style input with one-click suggested roles; pre-fills Job Search automatically

### **Career Planning**
- **Goal Setting**: Define short-term and long-term career objectives
- **Mentorship Matching**: Connect with industry professionals
- **Learning Resources**: Curated courses and certifications
- **Network Building**: Professional contact management

### **Enterprise Resilience**
- **Circuit Breaker Pattern**: Automatic failure detection and recovery for database operations
- **Structured Logging**: JSON-formatted logs with request tracking and performance metrics
- **Error Handling**: Consistent error responses with detailed error classification
- **Input Validation**: Schema-based validation with comprehensive error messages
- **Retry Logic**: Adaptive retry strategies for AWS service calls

## 🏗️ Architecture

### **Backend (Serverless AWS)**
- **AWS Lambda**: 17 serverless functions handling all CRUD operations
- **API Gateway**: HTTP API endpoints with CORS and optional Cognito authorizer
- **DynamoDB**: NoSQL database with user-scoped data partitioning
- **Cognito**: User authentication and authorization
- **S3**: File storage for resumes and documents

### **Frontend (React Web)**
- **React 18**: Modern React with hooks and functional components
- **AWS Amplify**: Authentication, API integration, and hosting
- **Material-UI**: Consistent design system and components
- **React Router**: Client-side routing and navigation

### **Mobile (React Native)**
- **React Native**: Cross-platform iOS and Android support
- **AWS Amplify**: Native authentication and API integration
- **React Navigation**: Native navigation with stack and tab patterns
- **Platform-specific UI**: Native components for optimal UX
- **Offline-first DataStore**: Local queueing, sync banners, and conflict resolution for critical data

### **Shared Utilities**
- **TypeScript**: Strongly typed interfaces and utilities
- **Common Logic**: Reusable business logic across platforms
- **Logger**: Structured logging utility with JSON formatting
- **ErrorHandler**: Consistent error response formatting
- **RequestHandler**: Input validation and request processing
- **DynamoDBUtil**: Database operations with circuit breaker protection

### **Data Models**

The platform uses four primary data models with user-scoped partitioning:

- **Users**: Profile information, authentication data
- **Jobs**: Job postings with company, location, salary details
- **Experiences**: Work history, skills, education (partitioned by userId)
- **Applications**: Job applications with status tracking (partitioned by userId)

### **Security & Secrets Management**

The platform implements enterprise-grade security practices:

- **AWS Secrets Manager**: Sensitive credentials and API keys
- **SSM Parameter Store**: Configuration parameters with encryption
- **IAM Roles**: Least-privilege access for Lambda functions
- **DynamoDB Encryption**: Server-side encryption for all data
- **HTTPS Only**: All API endpoints secured with TLS

Secrets are managed through automated scripts in [`scripts/setup-secrets.sh`](scripts/setup-secrets.sh). See [`SECRETS-README.md`](SECRETS-README.md) for detailed setup instructions.

## 🚀 Quick Start

### For Users (Using Released Version)

1. **Download the latest release**
   ```bash
   git clone https://github.com/jackyxhb/CareerHelper.git
   cd CareerHelper
   git checkout v0.0.2
   ```

2. **Follow deployment instructions below**

### For Developers (Contributing to the Project)

#### Prerequisites
- Node.js 18+ and Yarn
- AWS CLI configured with appropriate permissions
- Xcode (for iOS development) or Android Studio (for Android development)

#### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jackyxhb/CareerHelper.git
   cd CareerHelper
   ```

2. **Install all dependencies**
   ```bash
   yarn install:all
   ```

3. **Set up AWS Infrastructure**
   ```bash
   cd infrastructure
   cdk deploy
   cd ..
   ```

4. **Deploy Backend**
   ```bash
   yarn deploy:backend
   ```

5. **Configure Frontend Applications**
   ```bash
   # Web App
   cd web
   amplify init
   amplify add api
   amplify push
   cd ..

   # Mobile App
   cd mobile
   amplify init
   amplify add api
   amplify push
   cd ..
   ```

#### Development

Start the development servers:

```bash
# Web Application (http://localhost:3000)
cd web && yarn start

# Mobile Application (iOS/Android emulator)
cd mobile && yarn start
```

#### Testing

```bash
# Backend tests
cd backend && yarn test

# Web tests
cd web && yarn test

# Mobile tests
cd mobile && yarn test
```

## 📁 Project Structure

```
CareerHelper/
├── .github/                 # GitHub Actions CI/CD workflows
├── backend/                 # Serverless AWS Lambda functions
│   ├── functions/          # Lambda function handlers
│   ├── utils/              # Utility classes (Logger, ErrorHandler, DynamoDBUtil, RequestHandler)
│   ├── test/               # Unit tests
│   └── serverless.yml      # Serverless Framework config
├── web/                    # React web application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   └── App.js          # Main application component
│   └── package.json
├── mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── components/     # Reusable React Native components
│   │   ├── screens/        # Screen components
│   │   └── App.js          # Main application component
│   └── package.json
├── shared/                 # Shared TypeScript utilities
│   └── src/
│       └── index.ts        # Type definitions and utilities
├── infrastructure/         # AWS CDK infrastructure code
│   └── lib/
│       └── career-helper-stack.ts
├── docs/                   # Documentation and API specs
└── package.json           # Root package.json with workspaces
```

## 🔧 API Documentation

Complete API documentation is available in [`docs/api.md`](docs/api.md).

### Key Endpoints

- `GET /health` - Health check
- `GET /users/{userId}` - Get user profile
- `POST /users` - Create new user
- `PUT /users/{userId}` - Update profile (preferredName, city, country, jobPreferences)
- `GET /jobs` - List all jobs
- `POST /jobs` - Create job posting
- `GET /jobs/search` - Search jobs via JSearch + Adzuna/Seek (NZ/AU)
- `GET /experiences/{userId}` - Get user experiences
- `POST /experiences` - Add work experience
- `GET /applications/{userId}` - Get user applications
- `POST /applications` - Submit job application
- `POST /uploads/resume` - Issue signed upload URL
- `GET /uploads/resume` - List stored resumes
- `DELETE /uploads/resume/{resumeId}` - Delete resume
- `POST /resume/tailor` - AI resume tailoring
- `GET /analytics` - Usage analytics
- `POST /pmf` / `GET /pmf` - Product-market fit survey

## 🚢 Deployment

### Backend Deployment
```bash
cd backend
yarn deploy
```

### Web Deployment
```bash
yarn deploy:web
# Deploys to: http://careerhelper-web-dev-1765124463.s3-website-us-east-1.amazonaws.com
```

### Mobile Deployment
```bash
cd mobile
# iOS
yarn ios:release
# Android
yarn android:release
```

## 🧪 Testing Strategy

- **Unit Tests**: Lambda functions with mocked AWS services and utility classes
- **Circuit Breaker Tests**: Fault tolerance testing with failure simulation
- **Error Handling Tests**: Comprehensive error response validation
- **Integration Tests**: API endpoint testing with real AWS services
- **E2E Tests**: Full user workflow testing
- **Performance Tests**: Load testing for scalability validation

## 🔧 Troubleshooting

### Common Issues

**AWS Credentials Error**
```bash
# Configure AWS CLI
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-east-1
```

**Port Already in Use**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
cd web && PORT=3001 yarn start
```

**Metro Bundler Issues (React Native)**
```bash
cd mobile
yarn start --reset-cache
```

**CDK Deployment Issues**
```bash
# Bootstrap CDK (first time only)
cdk bootstrap

# Clear CDK cache
cd infrastructure && rm -rf cdk.out
```

**Resume Upload CORS Errors**
```bash
# Ensure the uploads bucket has the latest CORS rules
cd infrastructure
yarn cdk deploy --require-approval never
```

## 🤝 Contributing

We welcome contributions! Please see our [Development Instructions](instructions.md) for detailed guidelines.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with React rules
- **Prettier**: Consistent code formatting
- **Testing**: Minimum 80% code coverage required

## 📋 Changelog

### [v0.0.4](https://github.com/jackyxhb/CareerHelper/releases/tag/v0.0.4) - March 29, 2026
- 👤 **User Profile Settings**: preferred name, city/country dropdowns, job role tags — persisted via `PUT /users/{userId}`
- 🔍 **Job Search Pre-fill**: query and location auto-seeded from saved profile preferences
- 🌏 **Adzuna/Seek Integration**: NZ/AU job coverage via Adzuna API
- 🧪 **Test Coverage**: 47 tests total; `searchJobs` fully typed with `sanitizeForRetry` and `providersWarning`
- 🐛 **Fix**: `updateUser` Lambda was never deployed — profile saves now work

### [v0.0.3](https://github.com/jackyxhb/CareerHelper/releases/tag/v0.0.3) - March 29, 2026
- 🌏 **Adzuna/Seek Integration**: NZ and AU job search via Adzuna API
- ⚡ **Debounced Auto-Search**: fires after 2+ characters with 400ms debounce
- 📍 **Location Relevance Sorting**: exact-location matches ranked first
- 🤖 **AI Resume Tailoring**: personalized suggestions from resume + job description
- 📊 **Analytics & Onboarding**: event tracking, 4-step onboarding flow, PMF survey
- 🛡️ **Error Boundaries**: graceful error handling with retry

### [v0.0.2](https://github.com/jackyxhb/CareerHelper/releases/tag/v0.0.2) - December 9, 2025
- 📄 **Resume Uploads**: Cognito-secured signed URLs with DynamoDB metadata
- 📱 **Offline Sync**: Amplify DataStore with conflict handling and sync banners
- 🗂️ **Job Snapshot Persistence**: applications retain job details after listings expire
- 🌐 **CORS Hardening**: CDK-managed S3 bucket rules

### [v0.0.1](https://github.com/jackyxhb/CareerHelper/releases/tag/v0.0.1) - December 7, 2025
- 🎉 **Initial Release**: serverless backend, React web app, React Native mobile, AWS CDK, CI/CD

See [CHANGELOG.md](CHANGELOG.md) for the full history.

## 🚀 Roadmap

### Shipped
- [x] **AI Resume Tailoring** - Personalized resume suggestions based on job descriptions
- [x] **Analytics & Monitoring** - Event tracking and error boundaries
- [x] **Onboarding Flow** - Guided first-time user experience
- [x] **PMF Survey** - Product-market fit measurement
- [x] **User Profile Settings** - Preferred name, location, and job role preferences
- [x] **Adzuna/Seek Integration** - NZ/AU job search coverage

### Planned Features
- [ ] LinkedIn integration for network building
- [ ] Advanced analytics dashboard with career insights
- [ ] Multi-language support (i18n)
- [ ] Interview preparation tools and mock interviews
- [ ] Salary negotiation assistance
- [ ] Career transition planning and guidance

### Future Releases
- **v0.2.0**: Social features, advanced AI recommendations
- **v1.0.0**: Enterprise-ready with advanced security and compliance

## 🔄 Staying Up to Date

### Watch for Updates
- ⭐ **Star** this repository to get notified of new releases
- 🔔 **Watch** releases to receive notifications
- 📧 **Subscribe** to release announcements

### Updating Your Installation
```bash
# Check for new releases
gh release list

# Update to latest version
git fetch --tags
git checkout v0.0.4  # Replace with latest version
```

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- AWS Amplify team for excellent documentation
- React and React Native communities
- Serverless Framework contributors
- All our contributors and beta testers

## 📞 Support

- **📖 Documentation**: [Full Docs](docs/) | [API Reference](docs/api.md)
- **🐛 Issues**: [GitHub Issues](https://github.com/jackyxhb/CareerHelper/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/jackyxhb/CareerHelper/discussions)
- **📦 Releases**: [Download Latest](https://github.com/jackyxhb/CareerHelper/releases/latest)
- **🔄 Changelog**: [Release Notes](https://github.com/jackyxhb/CareerHelper/releases)

### Getting Help
- **Setup Issues**: Check the [Troubleshooting](#troubleshooting) section
- **Deployment Help**: See [Deployment](#deployment) instructions
- **Feature Requests**: Open a [GitHub Issue](https://github.com/jackyxhb/CareerHelper/issues/new?template=feature_request.md)
- **Bug Reports**: Use the [Bug Report](https://github.com/jackyxhb/CareerHelper/issues/new?template=bug_report.md) template

---

**Built with ❤️ for job seekers and career professionals worldwide**

**🎉 Officially released as v0.0.4 - Start your career journey today!**
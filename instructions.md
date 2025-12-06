# Instructions for GitHub Copilot: Building the CareerHelper Platform

This file provides detailed instructions for GitHub Copilot to generate the entire project structure, code, configurations, and documentation for the CareerHelper platform. The platform is a comprehensive career management system focusing on job opportunity management, experience management, and job application management, covering the full lifecycle of a user's career (e.g., from education and early jobs to mid-career transitions and retirement planning).

## Project Overview
- **Target Users**: Individual users (job seekers, professionals) who will interact via a web application and a mobile app.
- **Core Features**:
  - **Job Opportunity Management**: Search, save, and track job listings; personalized recommendations based on user profile; integration with external job APIs (e.g., LinkedIn or Indeed via AWS integrations).
  - **Experience Management**: Users can log work history, skills, education, certifications; generate resumes/CVs; track career progress with analytics (e.g., skill gaps, promotion timelines).
  - **Job Application Management**: Track applications, set reminders for follow-ups, store cover letters and references; status tracking (applied, interviewed, offered, rejected).
  - **Additional Lifecycle Features**: Career planning tools (e.g., goal setting, mentorship matching), networking features, salary negotiation tips, and retirement planning resources.
- **Technology Stack**:
  - **Cloud Provider**: AWS as the primary provider for scalability, security, and cost-efficiency.
  - **Backend**: Serverless architecture using AWS Lambda, API Gateway, and DynamoDB for database. Use Node.js or Python for Lambda functions.
  - **Frontend**:
    - Web: React.js with AWS Amplify for hosting and authentication.
    - Mobile: React Native for cross-platform (iOS/Android) app, integrated with AWS Amplify.
  - **Authentication**: AWS Cognito for user authentication, authorization, and federated logins (e.g., Google, Apple).
  - **Storage**: AWS S3 for file uploads (e.g., resumes, profile pictures).
  - **Other AWS Services**: 
    - Amazon SES for email notifications.
    - Amazon SNS for push notifications (mobile).
    - AWS Step Functions for orchestrating workflows (e.g., application tracking pipelines).
    - Amazon SageMaker or Bedrock for AI/ML features like job recommendations or resume optimization (optional advanced feature).
    - AWS CloudWatch for monitoring and logging.
    - AWS IAM for role-based access control.
- **Architecture Principles**:
  - Serverless-first to minimize costs and enable auto-scaling.
  - Microservices design for modularity (e.g., separate services for jobs, experiences, applications).
  - Secure by default: Use HTTPS, encrypt data in transit/rest, comply with GDPR-like privacy for user data.
  - Responsive and accessible UI/UX for web and mobile.
  - CI/CD: Use AWS CodePipeline or GitHub Actions for deployment.

## Step-by-Step Instructions for GitHub Copilot
Use these instructions to generate code and files in VS Code. Start by creating the root project structure, then populate folders with code. Comment your generations with references to this file for clarity.

### 1. Create Project Structure
Generate a monorepo structure for easy management of web, mobile, and backend.

Root folder: `CareerHelper`

- `/backend`: Serverless backend code.
  - `/functions`: Individual Lambda functions (e.g., jobSearch.js, userProfile.py).
  - `/layers`: Shared code layers for Lambda.
  - `serverless.yml`: Serverless Framework configuration for deployment.
- `/web`: React web app.
  - `/src`: Components, pages, services.
  - `/public`: Static assets.
  - `package.json`: Dependencies (react, aws-amplify, etc.).
- `/mobile`: React Native mobile app.
  - `/src`: Screens, components, navigation.
  - `/android`, `/ios`: Platform-specific folders.
  - `package.json`: Dependencies (react-native, aws-amplify-react-native).
- `/shared`: Shared code (e.g., types, utils) usable across backend/frontend.
- `/docs`: Documentation (e.g., API specs, architecture diagrams).
- `/infrastructure`: AWS CDK or Terraform scripts for infra-as-code.
- `README.md`: Project overview, setup instructions.
- `.gitignore`: Standard ignores for node_modules, builds, etc.
- `package.json`: Root-level for monorepo tools (e.g., yarn workspaces).

Prompt example: "Create a monorepo structure for a React web, React Native mobile, and AWS Lambda backend project called CareerHelper."

### 2. Set Up AWS Integration
- Generate AWS CDK (TypeScript) scripts in `/infrastructure` to provision:
  - Cognito User Pool and Identity Pool.
  - DynamoDB tables: `Users`, `Jobs`, `Experiences`, `Applications` (with appropriate schemas, e.g., UserID as partition key).
  - API Gateway with REST or GraphQL endpoints.
  - S3 bucket for user uploads.
  - Lambda roles and permissions.
- Include environment variables for AWS credentials (use .env files, but gitignore them).

Prompt example: "Generate AWS CDK code to create a Cognito User Pool, DynamoDB table for users, and S3 bucket for CareerHelper."

### 3. Backend Development
- Use Serverless Framework (`serverless.yml`) to define APIs.
- Key Endpoints (REST via API Gateway):
  - `/users`: CRUD for user profiles.
  - `/jobs`: Search, save, recommend jobs.
  - `/experiences`: Add/edit work history, generate resumes.
  - `/applications`: Track applications, notifications.
- Implement Lambda functions:
  - Authenticate requests with Cognito.
  - Interact with DynamoDB (use AWS SDK).
  - For AI features: Integrate Bedrock for natural language processing (e.g., parse resumes).
- Handle errors, logging to CloudWatch.

Prompt example: "Write a Node.js Lambda function for user registration using AWS Cognito and DynamoDB."

### 4. Web Frontend Development (React)
- Use AWS Amplify to scaffold: Authentication, API, Storage.
- Pages:
  - Login/Register (Cognito integration).
  - Dashboard: Overview of jobs, experiences, applications.
  - Job Search: Form with filters, results list.
  - Profile: Edit experiences, upload resume.
  - Application Tracker: Timeline view, reminders.
- Use React Router for navigation, Material-UI or Tailwind for styling.
- Connect to backend via Amplify API.

Prompt example: "Generate a React component for job search page integrated with AWS Amplify API."

### 5. Mobile App Development (React Native)
- Similar to web: Use Amplify for auth/API/storage.
- Screens:
  - Auth screens.
  - Home/Dashboard.
  - Job Explorer.
  - Experience Builder.
  - Application Manager.
- Use React Navigation for routing.
- Implement offline support with Amplify DataStore.
- Push notifications via SNS.

Prompt example: "Create a React Native screen for viewing and editing user experiences, with AWS S3 upload for resumes."

### 6. Shared Components and Utilities
- Types: Define TypeScript interfaces for data models (e.g., Job, Experience).
- Utils: Helpers for date formatting, API calls, error handling.

Prompt example: "Define TypeScript interfaces for Job and Application models in a shared folder."

### 7. Testing and Security
- Generate unit tests (Jest for frontend, Mocha for backend).
- Integration tests for AWS services.
- Security: Implement input validation, rate limiting in API Gateway.

Prompt example: "Write Jest tests for the React login component."

### 8. Deployment and CI/CD
- Scripts for deploying: `amplify push` for frontend, `sls deploy` for backend.
- GitHub Actions workflow for build/test/deploy.

Prompt example: "Create a GitHub Actions YAML file for CI/CD deploying to AWS."

### 9. Documentation and Best Practices
- API docs: Use OpenAPI/Swagger in `/docs`.
- Architecture diagram: Mermaid or PlantUML code.
- Ensure code is modular, commented, and follows ESLint/Prettier standards.

## Usage Notes for Copilot
- Generate code in small chunks: Focus on one file/component at a time.
- Reference AWS best practices: Scalable, cost-optimized, secure.
- If advanced features (e.g., ML for recommendations) are complex, mark them as optional Phase 2.
- After generation, review for completeness and suggest iterations.

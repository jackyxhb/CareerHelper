# CareerHelper

A comprehensive career management platform for job seekers and professionals.

## Overview

CareerHelper helps users manage their entire career lifecycle, from job searching and application tracking to experience building and career planning. Built as a monorepo with serverless AWS backend, React web app, and React Native mobile app.

## Features

- **Job Opportunity Management**: Search, save, and track job listings with personalized recommendations
- **Experience Management**: Log work history, skills, education, and generate resumes
- **Job Application Management**: Track applications, set reminders, and manage cover letters
- **Career Planning**: Goal setting, mentorship matching, and retirement planning resources

## Technology Stack

- **Backend**: AWS Lambda (Node.js/Python), API Gateway, DynamoDB, Cognito
- **Web**: React.js with AWS Amplify
- **Mobile**: React Native with AWS Amplify
- **Infrastructure**: AWS CDK

## Getting Started

1. Clone the repository
2. Install dependencies: `yarn install:all`
3. Set up AWS credentials and configure Amplify
4. Deploy infrastructure: `cd infrastructure && cdk deploy`
5. Deploy backend: `yarn deploy:backend`
6. Start development:
   - Web: `cd web && yarn start`
   - Mobile: `cd mobile && yarn start`

## Project Structure

- `/backend`: Serverless backend code
- `/web`: React web application
- `/mobile`: React Native mobile app
- `/shared`: Shared TypeScript types and utilities
- `/infrastructure`: AWS CDK infrastructure code
- `/docs`: Documentation and API specs

## Contributing

See `instructions.md` for detailed development guidelines.
# CareerHelper

[![CI/CD](https://github.com/jackyxhb/CareerHelper/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/jackyxhb/CareerHelper/actions/workflows/ci-cd.yml)

A comprehensive career management platform built as a monorepo with serverless AWS backend, React web app, and React Native mobile app. CareerHelper empowers job seekers and professionals to manage their entire career lifecycle through intelligent tracking, personalized recommendations, and seamless cross-platform experience.

## 📊 Project Status

✅ **Backend**: Complete serverless AWS implementation with 8 Lambda functions  
✅ **Web App**: Full React application with routing and components  
✅ **Mobile App**: React Native app with cross-platform support  
✅ **Infrastructure**: AWS CDK stack with DynamoDB, Cognito, and S3  
✅ **Testing**: Unit tests with AWS SDK v3 mocking  
✅ **CI/CD**: GitHub Actions workflows for automated deployment  
✅ **Documentation**: API specs and development guidelines  

**Ready for deployment and production use!**

## 🌟 Features

### **Job Opportunity Management**
- **Advanced Job Search**: Filter by location, salary, company, and keywords
- **Personalized Recommendations**: AI-powered job matching based on experience and preferences
- **Save & Track**: Bookmark interesting positions and monitor application status
- **Company Insights**: Research companies with salary data and employee reviews

### **Experience Management**
- **Work History Tracking**: Log positions, responsibilities, and achievements
- **Skills Assessment**: Track technical and soft skills with proficiency levels
- **Education Records**: Maintain academic credentials and certifications
- **Resume Generation**: Auto-generate professional resumes from your data

### **Application Tracking**
- **Comprehensive Tracking**: Monitor all applications with status updates
- **Interview Scheduling**: Set reminders for interviews and follow-ups
- **Cover Letter Management**: Store and reuse customized cover letters
- **Progress Analytics**: Visualize application success rates and trends

### **Career Planning**
- **Goal Setting**: Define short-term and long-term career objectives
- **Mentorship Matching**: Connect with industry professionals
- **Learning Resources**: Curated courses and certifications
- **Network Building**: Professional contact management

## 🏗️ Architecture

### **Backend (Serverless AWS)**
- **AWS Lambda**: 8 serverless functions handling all CRUD operations
- **API Gateway**: RESTful API endpoints with proper authentication
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

### **Shared Utilities**
- **TypeScript**: Strongly typed interfaces and utilities
- **Common Logic**: Reusable business logic across platforms

### **Data Models**

The platform uses four primary data models with user-scoped partitioning:

- **Users**: Profile information, authentication data
- **Jobs**: Job postings with company, location, salary details
- **Experiences**: Work history, skills, education (partitioned by userId)
- **Applications**: Job applications with status tracking (partitioned by userId)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Yarn
- AWS CLI configured with appropriate permissions
- Xcode (for iOS development) or Android Studio (for Android development)

### Installation

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

### Development

Start the development servers:

```bash
# Web Application (http://localhost:3000)
cd web && yarn start

# Mobile Application (iOS/Android emulator)
cd mobile && yarn start
```

### Testing

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

- `GET /users/{userId}` - Get user profile
- `POST /users` - Create new user
- `GET /jobs` - List all jobs
- `POST /jobs` - Create job posting
- `GET /users/{userId}/experiences` - Get user experiences
- `POST /experiences` - Add work experience
- `GET /users/{userId}/applications` - Get user applications
- `POST /applications` - Submit job application

## 🚢 Deployment

### Backend Deployment
```bash
cd backend
yarn deploy
```

### Web Deployment
```bash
cd web
amplify publish
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

- **Unit Tests**: Lambda functions with mocked AWS services
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

## 📋 Roadmap

- [ ] AI-powered resume optimization
- [ ] LinkedIn integration for network building
- [ ] Advanced analytics dashboard
- [ ] Mobile offline support
- [ ] Multi-language support
- [ ] Advanced job matching algorithms

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- AWS Amplify team for excellent documentation
- React and React Native communities
- Serverless Framework contributors
- All our contributors and beta testers

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/jackyxhb/CareerHelper/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jackyxhb/CareerHelper/discussions)
- **Documentation**: [Full Docs](docs/)

---

**Built with ❤️ for job seekers and career professionals worldwide**
# CareerHelper API Documentation

## Overview
The CareerHelper API provides endpoints for managing users, jobs, experiences, and applications.

## Base URL
`https://your-api-gateway-url`

## Authentication
All requests require AWS Cognito authentication. Include the Authorization header with the JWT token.

## Endpoints

### Users
- `GET /users/{userId}` - Get user profile
- `POST /users` - Create new user

### Jobs
- `GET /jobs` - Get all jobs
- `POST /jobs` - Create new job

### Experiences
- `GET /experiences/{userId}` - Get user's experiences
- `POST /experiences` - Add new experience

### Applications
- `GET /applications/{userId}` - Get user's applications
- `POST /applications` - Create new application

## Data Models

### User
```json
{
  "userId": "string",
  "email": "string",
  "name": "string",
  "createdAt": "string"
}
```

### Job
```json
{
  "jobId": "string",
  "title": "string",
  "company": "string",
  "location": "string",
  "description": "string",
  "salary": "number",
  "postedAt": "string"
}
```

### Experience
```json
{
  "userId": "string",
  "experienceId": "string",
  "title": "string",
  "company": "string",
  "startDate": "string",
  "endDate": "string",
  "description": "string"
}
```

### Application
```json
{
  "userId": "string",
  "applicationId": "string",
  "jobId": "string",
  "status": "applied|interviewed|offered|rejected",
  "appliedAt": "string",
  "notes": "string"
}
```
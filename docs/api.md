# CareerHelper API Documentation

## Overview
The CareerHelper API provides endpoints for managing users, jobs, experiences, applications, resumes, and analytics.

## Base URL
`https://lm5lnut0n5.execute-api.us-east-1.amazonaws.com`

## Authentication
All requests require AWS Cognito authentication. Include the Authorization header with the JWT token.

## Endpoints

### Users
- `GET /users/{userId}` - Get user profile
- `POST /users` - Create new user

### Jobs
- `GET /jobs` - Get all jobs with optional filters (search, location, type)
- `POST /jobs` - Create new job

### Experiences
- `GET /experiences/{userId}` - Get user's experiences
- `POST /experiences` - Add new experience
- `PUT /experiences/{experienceId}` - Update experience
- `DELETE /experiences/{experienceId}` - Delete experience

### Applications
- `GET /applications/{userId}` - Get user's applications
- `POST /applications` - Create new application
- `PUT /applications/{applicationId}` - Update application status
- `DELETE /applications/{applicationId}` - Delete application

### Resumes
- `GET /uploads/resume` - Get user's resumes
- `POST /uploads/resume` - Get signed upload URL for resume
- `DELETE /uploads/resume/{resumeId}` - Delete resume
- `POST /resume/tailor` - AI Resume Tailoring (GPT-4 powered)
- `GET /pmf` - Get PMF survey status
- `POST /pmf` - Submit PMF survey response

### Analytics
- `GET /analytics` - Get aggregate analytics (requires admin)

## Data Models

### User
```json
{
  "userId": "string",
  "email": "string",
  "name": "string",
  "createdAt": "string",
  "updatedAt": "string"
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
  "jobType": "full-time|part-time|contract|internship",
  "postedAt": "string",
  "createdBy": "string"
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
  "endDate": "string|null",
  "description": "string",
  "createdAt": "string"
}
```

### Application
```json
{
  "userId": "string",
  "applicationId": "string",
  "jobId": "string|null",
  "jobTitle": "string",
  "jobCompany": "string|null",
  "jobLocation": "string|null",
  "status": "applied|interview|offer|rejected",
  "appliedAt": "string",
  "notes": "string|null"
}
```

### Resume
```json
{
  "resumeId": "string",
  "userId": "string",
  "fileName": "string",
  "contentType": "string",
  "fileSize": "number",
  "downloadUrl": "string",
  "createdAt": "string"
}
```

### Resume Tailor Response
```json
{
  "overallScore": "number (0-100)",
  "summary": "string",
  "keywordsAdded": "string[]",
  "keywordsRemoved": "string[]",
  "suggestions": "string[]",
  "sections": [
    {
      "name": "string",
      "matchScore": "number",
      "changes": "string[]"
    }
  ]
}
```

### Analytics
```json
{
  "summary": {
    "totalUsers": "number",
    "totalApplications": "number",
    "totalExperiences": "number",
    "interviewRate": "number",
    "offerRate": "number",
    "averageApplicationsPerUser": "number",
    "averageExperiencesPerUser": "number",
    "applicationsByStatus": {
      "applied": "number",
      "interview": "number",
      "offer": "number",
      "rejected": "number"
    }
  },
  "experienceGaps": {
    "usersWithGaps": "number",
    "averageGapMonths": "number"
  }
}
```
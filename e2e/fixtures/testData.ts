export const testData = {
  validUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    name: 'Test User',
  },

  application: {
    company: 'Tech Corp',
    position: 'Software Engineer',
    status: 'Applied',
    notes: 'Applied through company website',
  },

  experience: {
    title: 'Senior Software Engineer',
    company: 'Innovation Labs',
    startDate: '2022-01-15',
    endDate: '2024-01-15',
    description:
      'Led development of microservices architecture. Managed team of 5 engineers.',
    skills: ['JavaScript', 'React', 'Node.js', 'AWS'],
  },

  resumeText: `John Doe
Senior Software Engineer

EXPERIENCE

Tech Corp, 2020-Present
Senior Software Engineer
- Led development of customer-facing web application serving 1M+ users
- Implemented CI/CD pipelines reducing deployment time by 60%
- Mentored junior developers and conducted code reviews
- Collaborated with product team to define feature requirements

Skills: JavaScript, React, Node.js, Python, AWS, Docker

EDUCATION

BS Computer Science
State University, 2019`,

  jobDescription: `Senior Software Engineer

We are looking for a Senior Software Engineer to join our growing team.

Requirements:
- 5+ years of experience in software development
- Strong proficiency in JavaScript, TypeScript, and React
- Experience with cloud platforms (AWS or GCP)
- Knowledge of containerization (Docker, Kubernetes)
- Experience with microservices architecture
- Strong problem-solving skills
- Excellent communication abilities

Preferred:
- Experience with Python or Go
- AWS certifications
- Agile/Scrum experience

Benefits:
- Competitive salary
- Health insurance
- 401k matching
- Remote work options`,

  job: {
    title: 'Software Engineer',
    company: 'Startup Inc',
    location: 'San Francisco, CA',
    salary: 120000,
    description: 'Build amazing products',
  },

  user: {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '555-123-4567',
  },
};

export const credentials = {
  valid: {
    email: process.env.E2E_USER_EMAIL || 'test@example.com',
    password: process.env.E2E_USER_PASSWORD || 'TestPassword123!',
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },
};

export const apiEndpoints = {
  baseUrl:
    process.env.API_URL ||
    'https://lm5lnut0n5.execute-api.us-east-1.amazonaws.com',
  resumeTailor: '/resume/tailor',
  pmf: '/pmf',
};

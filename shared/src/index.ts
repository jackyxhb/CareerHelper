export interface User {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  resumeKey?: string;
}

export interface Job {
  jobId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: number;
  postedAt: string;
}

export interface Experience {
  userId: string;
  experienceId: string;
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  description: string;
  pendingSync?: boolean;
  lastSyncedAt?: string;
}

export interface Application {
  userId: string;
  applicationId: string;
  jobId: string;
  status: 'APPLIED' | 'INTERVIEWING' | 'OFFERED' | 'REJECTED' | 'WITHDRAWN';
  appliedAt: string;
  notes?: string;
  pendingSync?: boolean;
  lastSyncedAt?: string;
}

export * from './models';

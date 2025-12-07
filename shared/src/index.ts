export interface User {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
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
}

export interface Application {
  userId: string;
  applicationId: string;
  jobId: string;
  status: 'applied' | 'interviewed' | 'offered' | 'rejected';
  appliedAt: string;
  notes?: string;
}

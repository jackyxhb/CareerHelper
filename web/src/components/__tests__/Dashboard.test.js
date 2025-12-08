import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { API } from 'aws-amplify';

jest.mock('aws-amplify', () => ({
  API: {
    get: jest.fn(),
  },
}));

describe('Dashboard', () => {
  beforeAll(() => {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  afterAll(() => {
    delete global.ResizeObserver;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard panels with fetched data', async () => {
    API.get.mockImplementation((apiName, path) => {
      if (path === '/jobs') {
        return Promise.resolve([
          { jobId: 'job-1', title: 'Frontend Engineer', company: 'Tech Co' },
          { jobId: 'job-2', title: 'Backend Engineer', company: 'Data Inc' },
        ]);
      }

      if (path.startsWith('/experiences/')) {
        return Promise.resolve([
          {
            experienceId: 'exp-1',
            title: 'Designer',
            company: 'Studio',
          },
        ]);
      }

      if (path.startsWith('/applications/')) {
        return Promise.resolve([
          {
            applicationId: 'app-1',
            jobId: 'job-2',
            status: 'Applied',
          },
        ]);
      }

      if (path === '/analytics') {
        return Promise.resolve({
          summary: {
            totalUsers: 4,
            totalApplications: 6,
            totalExperiences: 3,
            applicationsByStatus: {
              applied: 3,
              interviewing: 2,
              offered: 1,
            },
            interviewRate: 50,
            offerRate: 16.67,
            averageApplicationsPerUser: 1.5,
            averageExperiencesPerUser: 0.75,
          },
          experienceGaps: {
            usersWithGaps: 1,
            averageGapMonths: 8,
          },
        });
      }

      return Promise.resolve([]);
    });

    render(<Dashboard user={{ username: 'user-1' }} />);

    await waitFor(() => {
      expect(screen.getByText(/Frontend Engineer/)).toBeInTheDocument();
      expect(screen.getByText(/Designer/)).toBeInTheDocument();
      expect(
        screen.getByText(/Application for Job job-2: Applied/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Total Applications/)).toBeInTheDocument();
      expect(screen.getByText(/Interview Rate/)).toBeInTheDocument();
    });
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import AnalyticsPage from '../AnalyticsPage';
import { API } from 'aws-amplify';

jest.mock('aws-amplify', () => ({
  API: {
    get: jest.fn(),
  },
}));

describe('AnalyticsPage', () => {
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

  it('renders analytics metrics and status table', async () => {
    API.get.mockResolvedValueOnce({
      summary: {
        totalUsers: 3,
        totalApplications: 5,
        totalExperiences: 7,
        applicationsByStatus: {
          applied: 3,
          interviewing: 1,
          offered: 1,
        },
        interviewRate: 20,
        offerRate: 20,
        averageApplicationsPerUser: 1.67,
        averageExperiencesPerUser: 2.33,
      },
      experienceGaps: {
        usersWithGaps: 1,
        averageGapMonths: 5,
      },
    });

    render(<AnalyticsPage user={{ username: 'user-1' }} />);

    await waitFor(() => {
      expect(screen.getByText(/Career Insights/)).toBeInTheDocument();
      expect(screen.getByText(/Detailed Status Breakdown/)).toBeInTheDocument();
    });

    const appliedRow = screen.getByText('Applied').closest('tr');
    expect(appliedRow).toHaveTextContent('Applied');
    expect(appliedRow).toHaveTextContent('3');
    expect(API.get).toHaveBeenCalledWith('CareerHelperAPI', '/analytics');
  });
});

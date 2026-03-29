import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ApplicationTracker from '../ApplicationTracker';
import { API } from 'aws-amplify';

jest.mock('aws-amplify', () => ({
  API: {
    get: jest.fn(),
  },
}));

describe('ApplicationTracker', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders application list fetched from API', async () => {
    API.get
      .mockResolvedValueOnce([
        {
          applicationId: 'app-1',
          jobId: 'job-1',
          jobTitle: 'Product Designer',
          jobCompany: 'Design Co',
          jobLocation: 'Remote',
          status: 'INTERVIEWING',
          appliedAt: new Date('2024-01-02').toISOString(),
        },
      ])
      .mockResolvedValueOnce([
        { jobId: 'job-1', title: 'Product Designer', company: 'Design Co' },
      ]);

    render(<ApplicationTracker user={{ username: 'user-1' }} />);

    expect(screen.getByText('Application Tracker')).toBeInTheDocument();

    // Click on Applied tab to see non-SAVED applications
    await waitFor(() => {
      const appliedTab = screen.getByText(/Applied \(1\)/i);
      fireEvent.click(appliedTab);
    });

    await waitFor(() => {
      expect(screen.getByText(/Product Designer/i)).toBeInTheDocument();
      expect(screen.getByText(/Interviewing/i)).toBeInTheDocument();
    });
  });

  it('handles empty responses gracefully', async () => {
    API.get.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    render(<ApplicationTracker user={{ username: 'user-1' }} />);

    await waitFor(() => {
      expect(screen.getByText(/No applications yet/i)).toBeInTheDocument();
    });
  });
});

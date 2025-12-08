import { render, screen, waitFor } from '@testing-library/react';
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
          status: 'Interviewing',
          appliedAt: new Date('2024-01-02').toISOString(),
        },
      ])
      .mockResolvedValueOnce([{ jobId: 'job-1', title: 'Product Designer' }]);

    render(<ApplicationTracker />);

    expect(screen.getByText('Application Tracker')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Product Designer/i)).toBeInTheDocument();
      expect(screen.getByText(/Status: Interviewing/i)).toBeInTheDocument();
    });
  });

  it('handles empty responses gracefully', async () => {
    API.get.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    render(<ApplicationTracker />);

    await waitFor(() => {
      expect(screen.getByRole('list')).toBeEmptyDOMElement();
    });
  });
});

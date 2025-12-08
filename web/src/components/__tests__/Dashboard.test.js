import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { API } from 'aws-amplify';

jest.mock('aws-amplify', () => ({
  API: {
    get: jest.fn(),
  },
}));

describe('Dashboard', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard panels with fetched data', async () => {
    API.get
      .mockResolvedValueOnce([
        { jobId: 'job-1', title: 'Frontend Engineer', company: 'Tech Co' },
        { jobId: 'job-2', title: 'Backend Engineer', company: 'Data Inc' },
      ])
      .mockResolvedValueOnce([
        {
          experienceId: 'exp-1',
          title: 'Designer',
          company: 'Studio',
        },
      ])
      .mockResolvedValueOnce([
        {
          applicationId: 'app-1',
          jobId: 'job-2',
          status: 'Applied',
        },
      ]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Frontend Engineer/)).toBeInTheDocument();
      expect(screen.getByText(/Designer/)).toBeInTheDocument();
      expect(
        screen.getByText(/Application for Job job-2: Applied/)
      ).toBeInTheDocument();
    });
  });
});

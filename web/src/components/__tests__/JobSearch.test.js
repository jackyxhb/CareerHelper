import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import JobSearch from '../JobSearch';
import { API } from 'aws-amplify';

jest.mock('aws-amplify', () => ({
  API: {
    get: jest.fn(),
  },
}));

describe('JobSearch', () => {
  beforeEach(() => {
    API.get.mockResolvedValue([
      {
        jobId: 'job-1',
        title: 'Product Designer',
        company: 'Design Hub',
        location: 'Remote',
        description: 'Craft beautiful experiences.',
      },
      {
        jobId: 'job-2',
        title: 'Backend Engineer',
        company: 'Data Corp',
        location: 'New York',
        description: 'Scale APIs.',
      },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('filters jobs by search term', async () => {
    render(<JobSearch />);

    const searchInput = screen.getByPlaceholderText(/search jobs/i);

    await waitFor(() => {
      expect(screen.getByText(/Product Designer/)).toBeInTheDocument();
      expect(screen.getByText(/Backend Engineer/)).toBeInTheDocument();
    });

    fireEvent.change(searchInput, { target: { value: 'backend' } });

    await waitFor(() => {
      expect(screen.queryByText(/Product Designer/)).not.toBeInTheDocument();
      expect(screen.getByText(/Backend Engineer/)).toBeInTheDocument();
    });
  });
});

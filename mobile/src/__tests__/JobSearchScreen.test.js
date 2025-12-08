import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import JobSearchScreen from '../screens/JobSearchScreen';
import { API } from 'aws-amplify';

jest.mock('aws-amplify', () => ({
  API: {
    get: jest.fn(),
  },
}));

describe('JobSearchScreen', () => {
  beforeEach(() => {
    API.get.mockResolvedValue([
      {
        jobId: 'job-1',
        title: 'Mobile Developer',
        company: 'Mobile Co',
        location: 'Remote',
        description: 'Build apps',
      },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders jobs fetched from the API', async () => {
    render(<JobSearchScreen />);

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith('CareerHelperAPI', '/jobs');
    });

    expect(await screen.findByText(/Mobile Developer/)).toBeTruthy();
    expect(await screen.findByText(/Mobile Co - Remote/)).toBeTruthy();
  });
});

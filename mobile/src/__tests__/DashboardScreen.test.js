import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import DashboardScreen from '../screens/DashboardScreen';
import { Auth } from 'aws-amplify';

jest.mock('aws-amplify', () => ({
  Auth: {
    currentAuthenticatedUser: jest.fn(),
  },
}));

describe('DashboardScreen', () => {
  const navigation = { navigate: jest.fn() };

  beforeEach(() => {
    Auth.currentAuthenticatedUser.mockResolvedValue({
      attributes: { email: 'user@example.com' },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays the authenticated user email', async () => {
    render(<DashboardScreen navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome, user@example.com/)).toBeTruthy();
    });
  });
});

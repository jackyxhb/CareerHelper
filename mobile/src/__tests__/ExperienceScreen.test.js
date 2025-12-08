import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import ExperienceScreen from '../screens/ExperienceScreen';
import { API, Auth } from 'aws-amplify';

jest.mock('aws-amplify', () => ({
  API: {
    get: jest.fn(),
    post: jest.fn(),
  },
  Auth: {
    currentAuthenticatedUser: jest.fn(),
  },
}));

describe('ExperienceScreen', () => {
  beforeEach(() => {
    Auth.currentAuthenticatedUser.mockResolvedValue({ username: 'user-1' });
    API.get.mockResolvedValue([
      {
        experienceId: 'exp-1',
        title: 'Designer',
        company: 'Studio',
        description: 'Design things',
      },
    ]);
    API.post.mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and renders experiences', async () => {
    render(<ExperienceScreen />);

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith(
        'CareerHelperAPI',
        '/experiences/user-1'
      );
    });

    expect(await screen.findByText(/Designer/)).toBeTruthy();
    expect(await screen.findByText(/Studio/)).toBeTruthy();
  });

  it('submits a new experience', async () => {
    render(<ExperienceScreen />);

    const titleInput = screen.getByPlaceholderText('Job Title');
    const companyInput = screen.getByPlaceholderText('Company');
    const descriptionInput = screen.getByPlaceholderText('Description');
    const submitButton = screen.getByText('Add Experience');

    fireEvent.changeText(titleInput, 'Engineer');
    fireEvent.changeText(companyInput, 'BuildIt');
    fireEvent.changeText(descriptionInput, 'Ship features');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('CareerHelperAPI', '/experiences', {
        body: expect.objectContaining({
          userId: 'user-1',
          title: 'Engineer',
          company: 'BuildIt',
          description: 'Ship features',
        }),
      });
    });
  });
});

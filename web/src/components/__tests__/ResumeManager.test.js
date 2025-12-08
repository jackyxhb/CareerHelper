import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ResumeManager from '../ResumeManager';
import { API } from 'aws-amplify';

global.fetch = jest.fn();

jest.mock('aws-amplify', () => ({
  API: {
    get: jest.fn(),
    post: jest.fn(),
    del: jest.fn(),
  },
}));

describe('ResumeManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    API.get.mockResolvedValue({ resumes: [] });
    global.fetch.mockResolvedValue({ ok: true });
  });

  it('loads resumes and uploads a file', async () => {
    API.post.mockResolvedValue({
      resumeId: 'resume-1',
      uploadUrl: 'https://example.com/upload',
      objectKey: 'resumes/user/resume-1-test.pdf',
    });

    render(<ResumeManager user={{ username: 'user-1' }} />);

    await waitFor(() => expect(API.get).toHaveBeenCalled());

    const fileInput = screen.getByLabelText('Upload resume');
    const file = new File(['resume'], 'test.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(API.post).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/upload', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/pdf' },
      body: file,
    });

    await waitFor(() =>
      expect(
        screen.getByText('Resume uploaded successfully.')
      ).toBeInTheDocument()
    );
  });

  it('deletes a resume entry', async () => {
    const createdAt = new Date().toISOString();
    API.get
      .mockResolvedValueOnce({
        resumes: [
          {
            resumeId: 'resume-123',
            fileName: 'primary.pdf',
            createdAt,
            downloadUrl: 'https://example.com/download',
            contentType: 'application/pdf',
          },
        ],
      })
      .mockResolvedValue({ resumes: [] });

    render(<ResumeManager user={{ username: 'user-1' }} />);

    await waitFor(() =>
      expect(screen.getByText('primary.pdf')).toBeInTheDocument()
    );

    API.del.mockResolvedValue({ success: true });

    fireEvent.click(screen.getAllByText('Delete')[0]);

    await waitFor(() => expect(API.del).toHaveBeenCalledWith(
      'CareerHelperAPI',
      '/uploads/resume/resume-123'
    ));

    await waitFor(() =>
      expect(
        screen.getByText('Resume deleted successfully.')
      ).toBeInTheDocument()
    );
  });
});

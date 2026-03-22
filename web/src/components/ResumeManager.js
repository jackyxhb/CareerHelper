import React, { useCallback, useEffect, useRef, useState } from 'react';
import { API } from 'aws-amplify';
import { logError, logInfo } from '../utils/logger';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

function ResumeManager({ user }) {
  const [resumes, setResumes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const loadResumes = useCallback(async () => {
    if (!user?.username) {
      setResumes([]);
      return;
    }

    try {
      const response = await API.get('CareerHelperAPI', '/uploads/resume');
      setResumes(response?.resumes || []);
      setError(null);
      logInfo('Loaded resume metadata for dashboard', {
        items: response?.resumes?.length || 0,
      });
    } catch (err) {
      logError('Failed to load resume metadata', err);
      setError('Unable to load resumes. Please try again later.');
    }
  }, [user?.username]);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  const handleUpload = async event => {
    setFeedback(null);
    setError(null);

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('Resumes must be 15 MB or smaller.');
      fileInputRef.current.value = '';
      return;
    }

    setUploading(true);

    try {
      const presignResponse = await API.post(
        'CareerHelperAPI',
        '/uploads/resume',
        {
          body: {
            fileName: file.name,
            contentType: file.type || 'application/pdf',
            fileSize: file.size,
          },
        }
      );

      const uploadUrl = presignResponse?.uploadUrl;
      if (!uploadUrl) {
        throw new Error('Upload URL was not returned.');
      }

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/pdf',
        },
        body: file,
      });

      setFeedback('Resume uploaded successfully.');
      logInfo('Resume uploaded via signed URL', {
        resumeId: presignResponse?.resumeId,
      });
      await loadResumes();
    } catch (err) {
      logError('Resume upload failed', err);
      setError('We could not upload your resume. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async resumeId => {
    setFeedback(null);
    setError(null);

    try {
      await API.del('CareerHelperAPI', `/uploads/resume/${resumeId}`);
      setFeedback('Resume deleted successfully.');
      logInfo('Resume deleted from manager', { resumeId });
      await loadResumes();
    } catch (err) {
      logError('Failed to delete resume', err, { resumeId });
      setError('Unable to delete the resume right now.');
    }
  };

  if (!user?.username) {
    return (
      <div>
        <h2>Resume Library</h2>
        <p>Please sign in to manage resumes.</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {!user?.username ? (
        <>
          <div className="section-header">
            <h2>Resume Library</h2>
          </div>
          <div className="dashboard-card">
            <div className="empty-state">
              <div className="empty-state-icon">🔐</div>
              <h3>Sign in to manage resumes</h3>
              <p>Upload and manage your resumes for job applications.</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="section-header">
            <h2>Resume Library</h2>
            <p className="section-subtitle">
              Upload and manage resumes used across your applications
            </p>
          </div>

          <div className="dashboard-card">
            <h3>Upload New Resume</h3>
            <div className="resume-upload modern-upload">
              <div className="upload-zone">
                <span className="upload-icon">📄</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  aria-label="Upload resume"
                  onChange={handleUpload}
                  disabled={uploading}
                  id="resume-upload-input"
                />
                <label
                  htmlFor="resume-upload-input"
                  className="btn btn-outline"
                >
                  {uploading ? 'Uploading...' : 'Choose File'}
                </label>
                <span className="upload-hint">PDF or Word (max 15 MB)</span>
              </div>
            </div>

            {uploading && <div className="loading-spinner">Uploading...</div>}
            {feedback && (
              <div className={`alert alert-success`}>{feedback}</div>
            )}
            {error && <div className={`alert alert-error`}>{error}</div>}
          </div>

          {resumes.length > 0 ? (
            <div className="dashboard-card">
              <h3>Your Resumes</h3>
              <ul className="resume-list">
                {resumes.map(resume => (
                  <li key={resume.resumeId} className="resume-item">
                    <div className="resume-icon">📄</div>
                    <div className="resume-info">
                      <strong>{resume.fileName}</strong>
                      <div className="resume-meta">
                        Uploaded {new Date(resume.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="resume-actions">
                      <a
                        href={resume.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline btn-sm"
                      >
                        View
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(resume.resumeId)}
                        className="btn btn-outline btn-sm btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="dashboard-card">
              <div className="empty-state">
                <div className="empty-state-icon">📁</div>
                <h3>No resumes uploaded</h3>
                <p>Upload your first resume to use in job applications.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ResumeManager;

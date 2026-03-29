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
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Resume Library</h1>
          <p className="page-subtitle">Upload and manage your resumes</p>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔐</div>
            <div className="empty-state-title">Sign in to manage resumes</div>
            <p className="empty-state-text">
              Upload and manage your resumes for job applications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Resume Library</h1>
        <p className="page-subtitle">
          Upload and manage resumes used across your applications
        </p>
      </div>

      {feedback && (
        <div className="alert alert-success mb-6">{feedback}</div>
      )}
      {error && <div className="alert alert-error mb-6">{error}</div>}

      <div className="card mb-6">
        <div className="card-header">
          <h3 className="card-title">📄 Upload New Resume</h3>
        </div>

        <div style={{
          border: '2px dashed var(--color-border)',
          borderRadius: 'var(--radius)',
          padding: 'var(--space-8)',
          textAlign: 'center',
          backgroundColor: 'var(--color-bg)',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>📄</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleUpload}
            disabled={uploading}
            id="resume-upload-input"
            style={{ display: 'none' }}
          />
          <label
            htmlFor="resume-upload-input"
            className="btn btn-primary"
            style={{ cursor: 'pointer', marginBottom: 'var(--space-3)' }}
          >
            {uploading ? '⏳ Uploading...' : '📁 Choose File'}
          </label>
          <p className="text-sm text-muted">PDF or Word (max 15 MB)</p>
        </div>
      </div>

      {resumes.length > 0 ? (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Your Resumes ({resumes.length})</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
            {resumes.map(resume => (
              <div key={resume.resumeId} style={{
                padding: 'var(--space-4)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-4)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1 }}>
                  <div style={{ fontSize: '1.5rem' }}>📄</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                      {resume.fileName}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                      Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={resume.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    👁 View
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(resume.resumeId)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--color-error)' }}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <div className="empty-state-title">No resumes uploaded</div>
            <p className="empty-state-text">
              Upload your first resume to use in job applications.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeManager;

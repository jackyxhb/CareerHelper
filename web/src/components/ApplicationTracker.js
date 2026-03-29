import React, { useEffect, useState } from 'react';
import { API } from 'aws-amplify';
import { logError, logInfo } from '../utils/logger';

const STATUS_CONFIG = {
  APPLIED: { label: 'Applied', badgeClass: 'badge-primary' },
  INTERVIEWING: { label: 'Interviewing', badgeClass: 'badge-warning' },
  OFFERED: { label: 'Offered', badgeClass: 'badge-success' },
  REJECTED: { label: 'Rejected', badgeClass: 'badge-error' },
  WITHDRAWN: { label: 'Withdrawn', badgeClass: 'badge-primary' },
};

function relativeDate(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

function ApplicationTracker({ user }) {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('saved');
  const [applyingAppId, setApplyingAppId] = useState(null);
  const [applyNotes, setApplyNotes] = useState('');
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const userId = user?.username;

  useEffect(() => {
    if (!userId) {
      setApplications([]);
      return;
    }

    const fetchData = async currentUserId => {
      try {
        const [applicationsData, jobsData] = await Promise.all([
          API.get('CareerHelperAPI', `/applications/${currentUserId}`),
          API.get('CareerHelperAPI', '/jobs'),
        ]);
        setApplications(applicationsData || []);
        setJobs(jobsData || []);
        logInfo('Application and job data fetched', {
          userId: currentUserId,
          applications: applicationsData?.length || 0,
          jobs: jobsData?.length || 0,
        });
      } catch (error) {
        logError('Failed to fetch application tracker data', error, {
          userId: currentUserId,
        });
      }
    };

    fetchData(userId);
  }, [userId]);

  const getJobDetails = application => {
    const job = jobs.find(j => j.jobId === application.jobId);
    if (job) {
      return { title: job.title, company: job.company, location: job.location };
    }
    return {
      title: application.jobTitle || 'Unknown Job',
      company: application.jobCompany || null,
      location: application.jobLocation || null,
    };
  };

  const savedApps = applications.filter(a => a.status === 'SAVED');
  const appliedApps = applications.filter(a => a.status !== 'SAVED');

  const handleApplyFromTracker = async app => {
    setApplySubmitting(true);
    setFeedback(null);

    try {
      await API.put(
        'CareerHelperAPI',
        `/applications/${userId}/${app.applicationId}`,
        {
          body: {
            status: 'APPLIED',
            appliedAt: new Date().toISOString(),
            notes: applyNotes,
          },
        }
      );

      setApplications(prev =>
        prev.map(a =>
          a.applicationId === app.applicationId
            ? {
                ...a,
                status: 'APPLIED',
                appliedAt: new Date().toISOString(),
                notes: applyNotes,
              }
            : a
        )
      );

      setFeedback({
        type: 'success',
        message: `Applied to ${app.jobTitle || 'job'}!`,
      });
      setApplyingAppId(null);
      setApplyNotes('');
      setActiveTab('applied');
      logInfo('Application submitted from tracker', {
        applicationId: app.applicationId,
        userId,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: 'Could not submit application. Please try again.',
      });
      logError('Failed to apply from tracker', error, {
        applicationId: app.applicationId,
        userId,
      });
    } finally {
      setApplySubmitting(false);
    }
  };

  const handleDelete = async app => {
    setFeedback(null);

    try {
      await API.del(
        'CareerHelperAPI',
        `/applications/${userId}/${app.applicationId}`
      );

      setApplications(prev =>
        prev.filter(a => a.applicationId !== app.applicationId)
      );

      setFeedback({
        type: 'success',
        message: `Removed ${app.jobTitle || 'application'}.`,
      });
      setConfirmDeleteId(null);
      logInfo('Application deleted from tracker', {
        applicationId: app.applicationId,
        userId,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: 'Could not delete application. Please try again.',
      });
      logError('Failed to delete application from tracker', error, {
        applicationId: app.applicationId,
        userId,
      });
    }
  };

  if (!userId) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Application Tracker</h1>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔐</div>
            <div className="empty-state-title">
              Sign in to track applications
            </div>
            <p className="empty-state-text">
              Monitor your job applications and their statuses.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const interviewCount = applications.filter(
    a => a.status === 'INTERVIEWING'
  ).length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Application Tracker</h1>
          <p className="page-subtitle">
            Monitor your job applications and career progress
          </p>
        </div>
      </div>

      <div
        className="stats-grid"
        style={{
          gridTemplateColumns: 'repeat(3, 1fr)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ backgroundColor: '#eef2ff' }}
          >
            💾
          </div>
          <div
            className="stat-card-value"
            style={{ color: 'var(--color-primary)' }}
          >
            {savedApps.length}
          </div>
          <div className="stat-card-label">Saved</div>
        </div>
        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ backgroundColor: '#fef3c7' }}
          >
            🎤
          </div>
          <div
            className="stat-card-value"
            style={{ color: 'var(--color-warning)' }}
          >
            {interviewCount}
          </div>
          <div className="stat-card-label">Interviews</div>
        </div>
        <div
          className="stat-card"
          style={{
            background:
              'linear-gradient(135deg, var(--color-gray-900) 0%, var(--color-primary-dark) 100%)',
            border: 'none',
          }}
        >
          <div
            className="stat-card-icon"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            📊
          </div>
          <div className="stat-card-value" style={{ color: '#fff' }}>
            {appliedApps.length}
          </div>
          <div
            className="stat-card-label"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Applied
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} mb-6`}>
          {feedback.message}
        </div>
      )}

      {applications.length > 0 ? (
        <>
          <div className="tabs mb-6">
            <button
              className={`tab ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              Saved ({savedApps.length})
            </button>
            <button
              className={`tab ${activeTab === 'applied' ? 'active' : ''}`}
              onClick={() => setActiveTab('applied')}
            >
              Applied ({appliedApps.length})
            </button>
          </div>

          {activeTab === 'saved' ? (
            savedApps.length > 0 ? (
              <div className="grid-3">
                {savedApps.map(app => {
                  const details = getJobDetails(app);

                  return (
                    <div
                      key={app.applicationId}
                      className="card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-3)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 'var(--radius)',
                            backgroundColor: 'var(--color-primary-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.1rem',
                          }}
                        >
                          💾
                        </div>
                        <span className="badge badge-neutral">Saved</span>
                      </div>

                      <div>
                        <div
                          className="list-item-title"
                          style={{ fontSize: '1rem' }}
                        >
                          {details.title}
                        </div>
                        {details.company && (
                          <div className="list-item-subtitle">
                            {details.company}
                            {details.location ? ` • ${details.location}` : ''}
                          </div>
                        )}
                      </div>

                      <div
                        className="flex gap-2"
                        style={{ flexWrap: 'wrap', marginTop: 'auto' }}
                      >
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setApplyingAppId(app.applicationId)}
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDelete(app)}
                        >
                          Remove
                        </button>
                      </div>

                      {applyingAppId === app.applicationId && (
                        <div
                          style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                          }}
                          onClick={() => {
                            if (!applySubmitting) setApplyingAppId(null);
                          }}
                        >
                          <div
                            className="card"
                            style={{
                              width: '90%',
                              maxWidth: '500px',
                              maxHeight: '80vh',
                              overflowY: 'auto',
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            <h2 style={{ marginTop: 0 }}>
                              Apply for {details.title}
                            </h2>
                            <div className="form-group">
                              <label className="form-label">
                                Cover Letter (optional)
                              </label>
                              <textarea
                                className="form-input"
                                placeholder="Share why you're interested in this role..."
                                value={applyNotes}
                                onChange={e => setApplyNotes(e.target.value)}
                                rows="5"
                                disabled={applySubmitting}
                                style={{ fontFamily: 'inherit' }}
                              />
                            </div>
                            <div
                              className="flex gap-2"
                              style={{ justifyContent: 'flex-end' }}
                            >
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                  setApplyingAppId(null);
                                  setApplyNotes('');
                                }}
                                disabled={applySubmitting}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => handleApplyFromTracker(app)}
                                disabled={applySubmitting}
                              >
                                {applySubmitting
                                  ? 'Submitting...'
                                  : 'Submit Application'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">💾</div>
                  <div className="empty-state-title">No saved jobs yet</div>
                  <p className="empty-state-text">
                    Save jobs from the search to review and apply later.
                  </p>
                  <a href="/jobs" className="btn btn-primary">
                    Find Jobs
                  </a>
                </div>
              </div>
            )
          ) : (
            <div className="grid-3">
              {appliedApps.map(app => {
                const details = getJobDetails(app);
                const status = app.status?.toUpperCase() || 'APPLIED';
                const config = STATUS_CONFIG[status] || STATUS_CONFIG.APPLIED;
                const appliedDate = relativeDate(
                  app.appliedAt || app.createdAt
                );

                return (
                  <div
                    key={app.applicationId}
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 'var(--radius)',
                          backgroundColor: 'var(--color-primary-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                        }}
                      >
                        💼
                      </div>
                      <span className={`badge ${config.badgeClass}`}>
                        {config.label}
                      </span>
                    </div>

                    <div>
                      <div
                        className="list-item-title"
                        style={{ fontSize: '1rem' }}
                      >
                        {details.title}
                      </div>
                      {details.company && (
                        <div className="list-item-subtitle">
                          {details.company}
                          {details.location ? ` • ${details.location}` : ''}
                        </div>
                      )}
                    </div>

                    {appliedDate && (
                      <div className="text-sm text-muted">
                        🗓 Applied {appliedDate}
                      </div>
                    )}

                    {app.notes && (
                      <div
                        style={{
                          backgroundColor: 'var(--color-primary-light)',
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--space-3)',
                          fontSize: '0.8rem',
                          color: 'var(--color-primary-dark)',
                          fontStyle: 'italic',
                        }}
                      >
                        &ldquo;{app.notes}&rdquo;
                      </div>
                    )}

                    <div style={{ marginTop: 'auto' }}>
                      {confirmDeleteId === app.applicationId ? (
                        <div className="alert alert-warning">
                          <p style={{ margin: '0 0 var(--space-3)' }}>
                            Delete this application? This action cannot be
                            undone.
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(app)}
                            >
                              Confirm Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setConfirmDeleteId(app.applicationId)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🚀</div>
            <div className="empty-state-title">No applications yet</div>
            <p className="empty-state-text">
              Start saving and applying to jobs to track your progress.
            </p>
            <a href="/jobs" className="btn btn-primary">
              Find Jobs
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicationTracker;

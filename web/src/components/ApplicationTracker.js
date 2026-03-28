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

  if (!userId) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Application Tracker</h1>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔐</div>
            <div className="empty-state-title">Sign in to track applications</div>
            <p className="empty-state-text">Monitor your job applications and their statuses.</p>
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
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Application Tracker</h1>
          <p className="page-subtitle">Managing your professional journey with precision and calm.</p>
        </div>
        <a href="/jobs" className="btn btn-primary">
          + New Application
        </a>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 'var(--space-8)' }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ backgroundColor: '#eef2ff' }}>📋</div>
          <div className="stat-card-value" style={{ color: 'var(--color-primary)' }}>{applications.length}</div>
          <div className="stat-card-label">Total Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ backgroundColor: '#fef3c7' }}>🎤</div>
          <div className="stat-card-value" style={{ color: 'var(--color-warning)' }}>{interviewCount}</div>
          <div className="stat-card-label">Interviews</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, var(--color-gray-900) 0%, var(--color-primary-dark) 100%)', border: 'none' }}>
          <div className="stat-card-icon" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>📈</div>
          <div className="stat-card-value" style={{ color: '#fff' }}>
            {applications.length > 0
              ? `${Math.round((interviewCount / applications.length) * 100)}%`
              : '—'}
          </div>
          <div className="stat-card-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Interview Rate</div>
        </div>
      </div>

      {applications.length > 0 ? (
        <div className="grid-3">
          {applications.map(app => {
            const details = getJobDetails(app);
            const status = app.status?.toUpperCase() || 'APPLIED';
            const config = STATUS_CONFIG[status] || STATUS_CONFIG.APPLIED;
            const appliedDate = relativeDate(app.appliedAt || app.createdAt);

            return (
              <div key={app.applicationId} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                  <span className={`badge ${config.badgeClass}`}>{config.label}</span>
                </div>

                <div>
                  <div className="list-item-title" style={{ fontSize: '1rem' }}>{details.title}</div>
                  {details.company && (
                    <div className="list-item-subtitle">
                      {details.company}
                      {details.location ? ` • ${details.location}` : ''}
                    </div>
                  )}
                </div>

                {appliedDate && (
                  <div className="text-sm text-muted">🗓 Applied {appliedDate}</div>
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
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🚀</div>
            <div className="empty-state-title">No applications yet</div>
            <p className="empty-state-text">
              Start tracking your job applications to monitor your progress.
            </p>
            <a href="/jobs" className="btn btn-primary">Find Jobs</a>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicationTracker;

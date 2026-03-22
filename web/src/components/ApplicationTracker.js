import React, { useEffect, useState } from 'react';
import { API } from 'aws-amplify';
import { logError, logInfo } from '../utils/logger';

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
        const applicationsData = await API.get(
          'CareerHelperAPI',
          `/applications/${currentUserId}`
        );
        setApplications(applicationsData || []);

        const jobsData = await API.get('CareerHelperAPI', '/jobs');
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
      return {
        title: job.title,
        company: job.company,
        location: job.location,
      };
    }

    return {
      title: application.jobTitle || 'Unknown Job',
      company: application.jobCompany || null,
      location: application.jobLocation || null,
    };
  };

  const getStatusBadgeClass = status => {
    const s = status?.toLowerCase() || '';
    if (s === 'offer') return 'badge badge-success';
    if (s === 'interview') return 'badge badge-warning';
    if (s === 'rejected') return 'badge badge-error';
    return 'badge badge-neutral';
  };

  if (!userId) {
    return (
      <div className="analytics-page">
        <div className="section-header">
          <h2>Application Tracker</h2>
        </div>
        <div className="dashboard-card">
          <div className="empty-state">
            <div className="empty-state-icon">🔐</div>
            <h3>Sign in to track applications</h3>
            <p>Monitor your job applications and their statuses.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="section-header">
        <h2>Application Tracker</h2>
        <p className="section-subtitle">
          Track all your job applications in one place
        </p>
      </div>

      {applications.length > 0 ? (
        <div className="applications-grid">
          {applications.map(app => {
            const details = getJobDetails(app);
            return (
              <div
                key={app.applicationId}
                className="dashboard-card application-card"
              >
                <div className="application-header">
                  <h4>{details.title}</h4>
                  <span className={getStatusBadgeClass(app.status)}>
                    {app.status}
                  </span>
                </div>
                {details.company && (
                  <p className="application-company">{details.company}</p>
                )}
                {details.location && (
                  <p className="application-location">📍 {details.location}</p>
                )}
                <div className="application-meta">
                  <span>
                    Applied: {new Date(app.appliedAt).toLocaleDateString()}
                  </span>
                  {app.notes && (
                    <p className="application-notes">📝 {app.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="dashboard-card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No applications yet</h3>
            <p>
              Start tracking your job applications to monitor your progress.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicationTracker;

import React, { useEffect, useState } from 'react';
import { API } from 'aws-amplify';
import { logError, logInfo } from '../utils/logger';
import DashboardInsights from './DashboardInsights';

function Dashboard({ user, profile }) {
  const [jobs, setJobs] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [applications, setApplications] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.username) {
      setJobs([]);
      setExperiences([]);
      setApplications([]);
      setAnalytics(null);
      setIsLoading(false);
      return;
    }

    const fetchUserData = async userId => {
      try {
        const [jobsData, experiencesData, applicationsData] = await Promise.all([
          API.get('CareerHelperAPI', '/jobs'),
          API.get('CareerHelperAPI', `/experiences/${userId}`),
          API.get('CareerHelperAPI', `/applications/${userId}`),
        ]);

        setJobs(jobsData || []);
        setExperiences(experiencesData || []);
        setApplications(applicationsData || []);

        logInfo('Dashboard data refreshed', {
          userId,
          jobs: jobsData?.length || 0,
          experiences: experiencesData?.length || 0,
          applications: applicationsData?.length || 0,
        });
      } catch (error) {
        logError('Failed to fetch dashboard data', error, { userId });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData(user.username);
  }, [user?.username]);

  const loadAnalytics = async () => {
    try {
      const analyticsData = await API.get('CareerHelperAPI', '/analytics');
      setAnalytics(analyticsData || null);
    } catch (error) {
      logError('Failed to fetch analytics data', error);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
          <div className="loading-spinner" style={{ margin: '0 auto', marginBottom: 'var(--space-4)' }} />
          <p className="text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const savedApps = applications.filter(a => a.status === 'SAVED').length;
  const appliedApps = applications.filter(a => a.status !== 'SAVED').length;

  const stats = [
    {
      label: 'Job Opportunities',
      value: jobs.length,
      icon: '💼',
      color: '#6366f1',
      bgColor: '#eef2ff',
    },
    {
      label: 'Saved Jobs',
      value: savedApps,
      icon: '💾',
      color: '#8b5cf6',
      bgColor: '#f3e8ff',
    },
    {
      label: 'Applications',
      value: appliedApps,
      icon: '📤',
      color: '#10b981',
      bgColor: '#d1fae5',
    },
    {
      label: 'Interview Rate',
      value: analytics?.summary?.interviewRate
        ? `${Math.round(analytics.summary.interviewRate)}%`
        : '—',
      icon: '🎯',
      color: '#f59e0b',
      bgColor: '#fef3c7',
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="page-subtitle">
            Your professional narrative is evolving — here&apos;s your current career trajectory.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div
              className="stat-card-icon"
              style={{ backgroundColor: stat.bgColor }}
            >
              {stat.icon}
            </div>
            <div className="stat-card-value" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="stat-card-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📋 Recent Experiences</h3>
            <span className="badge badge-primary">{experiences.length}</span>
          </div>
          {experiences.length > 0 ? (
            <ul className="list">
              {experiences.slice(0, 3).map(exp => (
                <li key={exp.experienceId} className="list-item">
                  <div className="list-item-content">
                    <div className="list-item-title">{exp.title}</div>
                    <div className="list-item-subtitle">{exp.company}</div>
                  </div>
                  {exp.startDate && (
                    <span className="badge badge-primary">
                      {new Date(exp.startDate).getFullYear()}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <div className="empty-state-title">No experiences yet</div>
              <p className="empty-state-text">
                Add your work history to showcase your career
              </p>
              <a href="/experiences" className="btn btn-primary btn-sm">
                Add Experience
              </a>
            </div>
          )}
          {experiences.length > 3 && (
            <div style={{ borderTop: '1px solid var(--color-gray-100)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
              <a
                href="/experiences"
                style={{
                  color: 'var(--color-primary)',
                  fontWeight: 500,
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                }}
              >
                View all ({experiences.length}) →
              </a>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📤 Recent Applications</h3>
            <span className="badge badge-success">{applications.length}</span>
          </div>
          {applications.length > 0 ? (
            <ul className="list">
              {applications.slice(0, 3).map(app => (
                <li key={app.applicationId} className="list-item">
                  <div className="list-item-content">
                    <div className="list-item-title">{app.jobTitle || 'Job Application'}</div>
                    <div className="list-item-subtitle">
                      {app.jobCompany} • {new Date(
                        app.createdAt || Date.now()
                      ).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`badge badge-${getStatusColor(app.status)}`}>
                    {app.status || 'Applied'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🚀</div>
              <div className="empty-state-title">No applications yet</div>
              <p className="empty-state-text">
                Start tracking your job applications
              </p>
              <a href="/jobs" className="btn btn-primary btn-sm">
                Find Jobs
              </a>
            </div>
          )}
          {applications.length > 3 && (
            <div style={{ borderTop: '1px solid var(--color-gray-100)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
              <a
                href="/applications"
                style={{
                  color: 'var(--color-primary)',
                  fontWeight: 500,
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                }}
              >
                View all ({applications.length}) →
              </a>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-8)' }}>
        <DashboardInsights
          analytics={analytics}
          isLoading={false}
          error={null}
        />
      </div>

      <div className="card" style={{ marginTop: 'var(--space-8)' }}>
        <div className="card-header">
          <h3 className="card-title">💡 Quick Actions</h3>
        </div>
        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          <a href="/jobs" className="btn btn-primary">
            🔍 Find Jobs
          </a>
          <a href="/experiences" className="btn btn-secondary">
            ➕ Add Experience
          </a>
          <a href="/applications" className="btn btn-secondary">
            📊 View Applications
          </a>
          <a href="/resume-tailor" className="btn btn-secondary">
            ✨ AI Resume Tailor
          </a>
          <a href="/resumes" className="btn btn-secondary">
            📄 Manage Resumes
          </a>
          <a href="/profile" className="btn btn-secondary">
            👤 Profile Settings
          </a>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status) {
  const statusColors = {
    SAVED: 'neutral',
    APPLIED: 'primary',
    INTERVIEWING: 'warning',
    OFFERED: 'success',
    REJECTED: 'error',
    WITHDRAWN: 'secondary',
  };
  return statusColors[status] || 'primary';
}

export default Dashboard;

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
        const [jobsData, experiencesData, applicationsData] = await Promise.all(
          [
            API.get('CareerHelperAPI', '/jobs'),
            API.get('CareerHelperAPI', `/experiences/${userId}`),
            API.get('CareerHelperAPI', `/applications/${userId}`),
          ]
        );

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
        <div className="text-center p-6">
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p className="mt-4 text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Active Jobs',
      value: jobs.length,
      icon: '💼',
      color: '#6366f1',
      bgColor: '#eef2ff',
    },
    {
      label: 'Experiences',
      value: experiences.length,
      icon: '📋',
      color: '#8b5cf6',
      bgColor: '#f3e8ff',
    },
    {
      label: 'Applications',
      value: applications.length,
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
        <h1 className="page-title">
          Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}!
          👋
        </h1>
        <p className="page-subtitle">
          Your professional narrative is evolving — here&apos;s your current
          career trajectory.
        </p>
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
              <a href="/experiences" className="btn btn-primary">
                Add Experience
              </a>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📤 Recent Applications</h3>
          </div>
          {applications.length > 0 ? (
            <ul className="list">
              {applications.slice(0, 3).map(app => (
                <li key={app.applicationId} className="list-item">
                  <div className="list-item-content">
                    <div className="list-item-title">
                      Application #{app.applicationId.slice(0, 8)}
                    </div>
                    <div className="list-item-subtitle">
                      {new Date(
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
              <a href="/applications" className="btn btn-primary">
                Track Applications
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <DashboardInsights
          analytics={analytics}
          isLoading={false}
          error={null}
        />
      </div>

      <div className="mt-8">
        <div className="card">
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
            <a href="/resume-tailor" className="btn btn-secondary">
              ✨ AI Resume Tailor
            </a>
            <a href="/resumes" className="btn btn-secondary">
              📄 Manage Resumes
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status) {
  const statusColors = {
    APPLIED: 'primary',
    INTERVIEWING: 'warning',
    OFFERED: 'success',
    REJECTED: 'error',
    WITHDRAWN: 'secondary',
  };
  return statusColors[status] || 'primary';
}

export default Dashboard;

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

function DashboardInsights({ analytics, isLoading, error }) {
  const statusData = useMemo(() => {
    if (!analytics?.summary?.applicationsByStatus) {
      return [];
    }

    return Object.entries(analytics.summary.applicationsByStatus).map(
      ([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
      })
    );
  }, [analytics]);

  if (isLoading) {
    return (
      <section className="dashboard-section">
        <h3>Career Insights</h3>
        <div className="dashboard-card">
          <p>Loading analytics…</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dashboard-section">
        <h3>Career Insights</h3>
        <div className="dashboard-card">
          <p>{error}</p>
        </div>
      </section>
    );
  }

  if (!analytics) {
    return null;
  }

  const {
    summary: {
      totalUsers = 0,
      totalApplications = 0,
      totalExperiences = 0,
      interviewRate = 0,
      offerRate = 0,
      averageApplicationsPerUser = 0,
      averageExperiencesPerUser = 0,
    } = {},
    experienceGaps: {
      usersWithGaps = 0,
      averageGapMonths = 0,
    } = {},
  } = analytics;

  return (
    <section className="dashboard-section">
      <h3>Career Insights</h3>
      <div className="dashboard-metrics-grid">
        <div className="dashboard-card">
          <span className="dashboard-card-title">Total Applications</span>
          <span className="dashboard-card-value">{totalApplications}</span>
          <span className="dashboard-card-caption">Across all users</span>
        </div>
        <div className="dashboard-card">
          <span className="dashboard-card-title">Interview Rate</span>
          <span className="dashboard-card-value">{interviewRate}%</span>
          <span className="dashboard-card-caption">
            Interviews per application
          </span>
        </div>
        <div className="dashboard-card">
          <span className="dashboard-card-title">Offer Rate</span>
          <span className="dashboard-card-value">{offerRate}%</span>
          <span className="dashboard-card-caption">Offers per application</span>
        </div>
        <div className="dashboard-card">
          <span className="dashboard-card-title">Avg Apps / User</span>
          <span className="dashboard-card-value">{averageApplicationsPerUser}</span>
          <span className="dashboard-card-caption">Rolling portfolio size</span>
        </div>
        <div className="dashboard-card">
          <span className="dashboard-card-title">Avg Experiences / User</span>
          <span className="dashboard-card-value">{averageExperiencesPerUser}</span>
          <span className="dashboard-card-caption">Resume depth indicator</span>
        </div>
        <div className="dashboard-card">
          <span className="dashboard-card-title">Users With Gaps</span>
          <span className="dashboard-card-value">{usersWithGaps}</span>
          <span className="dashboard-card-caption">
            Avg gap: {averageGapMonths} months
          </span>
        </div>
        <div className="dashboard-card">
          <span className="dashboard-card-title">Total Users</span>
          <span className="dashboard-card-value">{totalUsers}</span>
          <span className="dashboard-card-caption">Active in workspace</span>
        </div>
        <div className="dashboard-card">
          <span className="dashboard-card-title">Experiences Logged</span>
          <span className="dashboard-card-value">{totalExperiences}</span>
          <span className="dashboard-card-caption">Career history items</span>
        </div>
      </div>

      {statusData.length > 0 && (
        <div className="dashboard-card dashboard-chart">
          <h4>Applications by Status</h4>
          <div className="dashboard-chart-inner">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="status" stroke="#6b7280" />
                <YAxis allowDecimals={false} stroke="#6b7280" />
                <Tooltip cursor={{ fill: 'rgba(191, 219, 254, 0.25)' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}

export default DashboardInsights;

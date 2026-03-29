import React, { useEffect, useMemo, useState } from 'react';
import { API } from 'aws-amplify';
import DashboardInsights from './DashboardInsights';
import { logError, logInfo } from '../utils/logger';

function AnalyticsPage({ user }) {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadAnalytics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await API.get('CareerHelperAPI', '/analytics');
        if (!isMounted) {
          return;
        }
        setAnalytics(data || null);
        const totals = data?.summary || {};
        logInfo('Analytics page data loaded', {
          totalApplications: totals.totalApplications || 0,
          offerRate: totals.offerRate || 0,
        });
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError('Unable to load analytics right now.');
        logError('Failed to fetch analytics for analytics page', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  const statusRows = useMemo(() => {
    if (!analytics?.summary?.applicationsByStatus) {
      return [];
    }

    return Object.entries(analytics.summary.applicationsByStatus)
      .map(([status, count]) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [analytics]);

  if (!user?.username) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Track your career progress and milestones</p>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">Sign in to view analytics</div>
            <p className="empty-state-text">
              Monitor your job search performance, application trends, and career trajectory.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Analytics</h1>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div className="loading-spinner" style={{ margin: '0 auto', marginBottom: 'var(--space-4)' }} />
          <p className="text-muted">Loading your analytics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Analytics</h1>
        </div>
        <div className="alert alert-error mb-6">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">
          High-level metrics aggregated from your CareerHelper activity
        </p>
      </div>

      <DashboardInsights
        analytics={analytics}
        isLoading={isLoading}
        error={error}
      />

      {statusRows.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--space-8)' }}>
          <div className="card-header">
            <h3 className="card-title">📊 Detailed Status Breakdown</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3)', fontWeight: 600 }}>Status</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-3)', fontWeight: 600 }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {statusRows.map(row => (
                  <tr key={row.label} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3)', color: 'var(--color-text)' }}>{row.label}</td>
                    <td style={{ textAlign: 'right', padding: 'var(--space-3)', fontWeight: 500, color: 'var(--color-primary)' }}>
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;

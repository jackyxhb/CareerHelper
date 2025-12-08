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
      <div className="analytics-page">
        <h2>Analytics</h2>
        <p>Please sign in to view analytics.</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <h2>Analytics</h2>
      <p className="analytics-subtitle">
        High-level metrics aggregated from CareerHelper activity.
      </p>

      <DashboardInsights analytics={analytics} isLoading={isLoading} error={error} />

      {statusRows.length > 0 && (
        <div className="dashboard-card analytics-status-table">
          <h4>Detailed Status Breakdown</h4>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Applications</th>
              </tr>
            </thead>
            <tbody>
              {statusRows.map(row => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { API } from 'aws-amplify';
import { logError, logInfo } from '../utils/logger';

function JobSearch({ user }) {
  const [internalJobs, setInternalJobs] = useState([]);
  const [externalJobs, setExternalJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const [submittingJobId, setSubmittingJobId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [externalError, setExternalError] = useState(null);
  const [isExternalLoading, setIsExternalLoading] = useState(false);

  const externalCacheRef = useRef(new Map());

  const userId = user?.username;

  const fetchJobs = useCallback(async () => {
    try {
      const jobsData = await API.get('CareerHelperAPI', '/jobs');
      const normalized = (jobsData || []).map(job => ({
        ...job,
        source: 'Internal',
      }));
      setInternalJobs(normalized);
      logInfo('Jobs fetched for search view', { items: normalized.length });
    } catch (error) {
      logError('Failed to fetch jobs on web', error);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleApply = async job => {
    if (!userId) {
      setFeedback({
        type: 'error',
        message: 'You need to be signed in to apply.',
      });
      return;
    }

    setSubmittingJobId(job.jobId);
    setFeedback(null);

    try {
      await API.post('CareerHelperAPI', '/applications', {
        body: {
          userId,
          jobId: job.jobId,
          status: 'APPLIED',
          notes: '',
          jobTitle: job.title,
          jobCompany: job.company,
          jobLocation: job.location,
          jobSource: job.source,
        },
      });

      setFeedback({
        type: 'success',
        message:
          job.source === 'Internal'
            ? `Application submitted for ${job.title}!`
            : `Saved ${job.title} to your tracker.`,
      });
      logInfo('Application submitted from job search', {
        jobId: job.jobId,
        userId,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: 'Could not submit application. Please try again.',
      });
      logError('Failed to submit application from job search', error, {
        jobId: job.jobId,
        userId,
      });
    } finally {
      setSubmittingJobId(null);
    }
  };

  useEffect(() => {
    const trimmedQuery = searchTerm.trim();
    const trimmedLocation = locationTerm.trim();

    if (trimmedQuery.length < 2) {
      setExternalJobs([]);
      setExternalError(null);
      return;
    }

    const cacheKey = `${trimmedQuery.toLowerCase()}|${trimmedLocation.toLowerCase()}`;
    const cached = externalCacheRef.current.get(cacheKey);
    if (cached) {
      setExternalJobs(cached);
      setExternalError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsExternalLoading(true);
      setExternalError(null);

      try {
        const result = await API.get('CareerHelperAPI', '/jobs/search', {
          queryStringParameters: {
            query: trimmedQuery,
            ...(trimmedLocation ? { location: trimmedLocation } : {}),
          },
        });

        const jobsFromSearch = (result?.jobs || []).map(job => ({
          ...job,
          source: job.source || 'JSearch',
        }));

        externalCacheRef.current.set(cacheKey, jobsFromSearch);
        setExternalJobs(jobsFromSearch);
        logInfo('External job search completed', {
          items: jobsFromSearch.length,
        });
      } catch (error) {
        setExternalError('Unable to fetch external listings right now.');
        logError('Failed to fetch external jobs', error);
      } finally {
        setIsExternalLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [locationTerm, searchTerm]);

  const filteredInternalJobs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return internalJobs.filter(
      job =>
        job.title.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term)
    );
  }, [internalJobs, searchTerm]);

  const combinedJobs = useMemo(
    () => [...filteredInternalJobs, ...externalJobs],
    [filteredInternalJobs, externalJobs]
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🔍 Find Your Next Role</h1>
        <p className="page-subtitle">
          Search for jobs and track your applications
        </p>
      </div>

      <div className="card mb-6">
        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
            <label className="form-label">Job Title or Keyword</label>
            <input
              type="text"
              className="form-input"
              placeholder="Software Engineer, Product Manager..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">Location</label>
            <input
              type="text"
              className="form-input"
              placeholder="San Francisco, Remote..."
              value={locationTerm}
              onChange={e => setLocationTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} mb-6`}>
          {feedback.message}
        </div>
      )}

      {isExternalLoading && (
        <div className="card text-center p-6">
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p className="mt-4 text-muted">Searching external listings...</p>
        </div>
      )}

      {externalError && (
        <div className="alert alert-warning mb-6">⚠️ {externalError}</div>
      )}

      {combinedJobs.length > 0 ? (
        <div className="stats-grid" style={{ marginBottom: '1rem' }}>
          <div className="stat-card">
            <div
              className="stat-card-icon"
              style={{ backgroundColor: '#eef2ff' }}
            >
              📋
            </div>
            <div className="stat-card-value">{filteredInternalJobs.length}</div>
            <div className="stat-card-label">Saved Jobs</div>
          </div>
          <div className="stat-card">
            <div
              className="stat-card-icon"
              style={{ backgroundColor: '#dbeafe' }}
            >
              🌐
            </div>
            <div className="stat-card-value">{externalJobs.length}</div>
            <div className="stat-card-label">External Listings</div>
          </div>
        </div>
      ) : null}

      {combinedJobs.length > 0 ? (
        <div className="grid-2">
          {combinedJobs.map(job => (
            <div key={job.jobId} className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ margin: 0 }}>
                  {job.title}
                </h3>
                <span
                  className={`badge badge-${job.source === 'Internal' ? 'primary' : 'secondary'}`}
                >
                  {job.source || 'Internal'}
                </span>
              </div>

              <div className="mt-4">
                <p
                  style={{
                    margin: '0 0 0.5rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  🏢 {job.company}
                </p>
                {job.location && (
                  <p
                    style={{
                      margin: '0 0 0.5rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    📍 {job.location}
                  </p>
                )}
                {job.salary && (
                  <p
                    style={{
                      margin: '0 0 0.5rem',
                      color: 'var(--color-success)',
                    }}
                  >
                    💰 {job.salary}
                  </p>
                )}
              </div>

              {job.description && (
                <p
                  className="text-sm text-muted mt-4"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {job.description}
                </p>
              )}

              <div className="flex gap-2 mt-4" style={{ flexWrap: 'wrap' }}>
                {job.externalUrl && (
                  <a
                    href={job.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    View Listing ↗
                  </a>
                )}
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleApply(job)}
                  disabled={!userId || submittingJobId === job.jobId}
                >
                  {submittingJobId === job.jobId
                    ? 'Submitting...'
                    : job.source === 'Internal'
                      ? 'Apply Now'
                      : 'Save to Tracker'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : searchTerm.length >= 2 && !isExternalLoading ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No jobs found</div>
          <p className="empty-state-text">
            Try adjusting your search terms or check back later
          </p>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">💼</div>
          <div className="empty-state-title">Ready to find your next role?</div>
          <p className="empty-state-text">
            Enter a job title or keyword to search for opportunities
          </p>
        </div>
      )}
    </div>
  );
}

export default JobSearch;

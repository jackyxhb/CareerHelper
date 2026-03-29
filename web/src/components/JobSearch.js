import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { API } from 'aws-amplify';
import { logError, logInfo } from '../utils/logger';

function profileLocation(p) {
  return [p?.city, p?.country].filter(Boolean).join(', ');
}

function naturalKey(job) {
  return `${job.title || job.job_title || ''}|${job.company || job.employer_name || ''}|${job.location || job.job_city || ''}`;
}

function JobSearch({ user, profile }) {
  const [internalJobs, setInternalJobs] = useState([]);
  const [externalJobs, setExternalJobs] = useState([]);
  // Lazy initialisers seed from profile if it is already loaded on mount.
  const [searchTerm, setSearchTerm] = useState(
    () => profile?.jobPreferences?.[0] || ''
  );
  const [locationTerm, setLocationTerm] = useState(() =>
    profileLocation(profile)
  );
  // Tracks whether the user has explicitly triggered a search (button or Enter).
  // Prevents showing "No jobs found" on first load before any search is attempted.
  const [hasSearched, setHasSearched] = useState(false);
  const [submittingJobId, setSubmittingJobId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [externalError, setExternalError] = useState(null);
  const [isExternalLoading, setIsExternalLoading] = useState(false);
  const [savedAppsMap, setSavedAppsMap] = useState(new Map());
  const [unsavingJobKey, setUnsavingJobKey] = useState(null);

  const externalCacheRef = useRef(new Map());
  const debounceRef = useRef(null);

  // Handle the async case: profile arrives after mount.
  // Functional updaters (prev => prev || default) ensure we never
  // overwrite something the user has already typed.
  useEffect(() => {
    if (!profile) return;
    const defaultSearch = profile?.jobPreferences?.[0] || '';
    const defaultLoc = profileLocation(profile);
    if (defaultSearch) setSearchTerm(prev => prev || defaultSearch);
    if (defaultLoc) setLocationTerm(prev => prev || defaultLoc);
  }, [profile]);

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

  const fetchApplications = useCallback(async () => {
    if (!userId) return;
    try {
      const apps = await API.get('CareerHelperAPI', `/applications/${userId}`);
      const map = new Map();
      (apps || []).forEach(app => {
        const key = `${app.jobTitle || ''}|${app.jobCompany || ''}|${app.jobLocation || ''}`;
        map.set(key, { applicationId: app.applicationId, status: app.status });
      });
      setSavedAppsMap(map);
      logInfo('Applications fetched', { items: map.size });
    } catch (error) {
      logError('Failed to fetch applications', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, [fetchJobs, fetchApplications]);

  const runExternalSearch = useCallback(async (query, location) => {
    const trimmedQuery = query.trim();
    const trimmedLocation = location.trim();

    if (!trimmedQuery) {
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
      setExternalError(
        'External listings unavailable — showing saved jobs only.'
      );
      logError('Failed to fetch external jobs', error);
    } finally {
      setIsExternalLoading(false);
    }
  }, []);

  // Debounced auto-search as user types (min 2 chars)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchTerm.trim().length < 2) {
      setExternalJobs([]);
      setExternalError(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      setHasSearched(true);
      runExternalSearch(searchTerm, locationTerm);
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, locationTerm, runExternalSearch]);

  const handleSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setHasSearched(true);
    runExternalSearch(searchTerm, locationTerm);
  }, [searchTerm, locationTerm, runExternalSearch]);

  const handleKeyDown = useCallback(
    e => {
      if (e.key === 'Enter') handleSearch();
    },
    [handleSearch]
  );

  const getJobState = useCallback(
    job => {
      const key = naturalKey(job);
      return savedAppsMap.get(key);
    },
    [savedAppsMap]
  );

  const handleSave = async job => {
    if (!userId) {
      setFeedback({
        type: 'error',
        message: 'You need to be signed in to save jobs.',
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
          status: 'SAVED',
          jobTitle: job.title || job.job_title,
          jobCompany: job.company || job.employer_name,
          jobLocation: job.location || job.job_city,
          jobSource: job.source,
        },
      });

      const key = naturalKey(job);
      setSavedAppsMap(prev =>
        new Map(prev).set(key, { applicationId: job.jobId, status: 'SAVED' })
      );

      setFeedback({
        type: 'success',
        message: `Saved ${job.title || job.job_title} to your tracker.`,
      });
      logInfo('Job saved from search', {
        jobId: job.jobId,
        userId,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: 'Could not save job. Please try again.',
      });
      logError('Failed to save job from search', error, {
        jobId: job.jobId,
        userId,
      });
    } finally {
      setSubmittingJobId(null);
    }
  };

  const handleUnsave = async job => {
    const key = naturalKey(job);
    const appData = savedAppsMap.get(key);
    if (!appData) return;

    setUnsavingJobKey(key);
    setFeedback(null);

    try {
      await API.del(
        'CareerHelperAPI',
        `/applications/${userId}/${appData.applicationId}`
      );

      setSavedAppsMap(prev => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });

      setFeedback({
        type: 'success',
        message: `Removed ${job.title || job.job_title} from saved jobs.`,
      });
      logInfo('Job unsaved from search', {
        jobId: job.jobId,
        userId,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: 'Could not unsave job. Please try again.',
      });
      logError('Failed to unsave job from search', error, {
        jobId: job.jobId,
        userId,
      });
    } finally {
      setUnsavingJobKey(null);
    }
  };

  const filteredInternalJobs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return internalJobs.filter(
      job =>
        job.title.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term)
    );
  }, [internalJobs, searchTerm]);

  // JSearch's location filter is approximate — it returns remote jobs and adjacent
  // areas alongside the requested location. Sort by relevance so exact-location
  // matches surface first, then remote, then unrelated results.
  const sortedExternalJobs = useMemo(() => {
    if (!locationTerm.trim()) return externalJobs;
    const loc = locationTerm.trim().toLowerCase();
    const score = job => {
      const jobLoc = (job.location || '').toLowerCase();
      if (jobLoc.includes(loc)) return 0;
      if (jobLoc.includes('remote') || jobLoc === '') return 1;
      return 2;
    };
    return [...externalJobs].sort((a, b) => score(a) - score(b));
  }, [externalJobs, locationTerm]);

  const combinedJobs = useMemo(
    () => [...filteredInternalJobs, ...sortedExternalJobs],
    [filteredInternalJobs, sortedExternalJobs]
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Discover Your Future.</h1>
        <p className="page-subtitle">
          Browse thousands of curated opportunities with our intelligent
          matching engine.
        </p>
      </div>

      <div className="card mb-6">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Job Title or Keyword</label>
            <input
              type="text"
              className="form-input"
              placeholder="Software Engineer, Product Manager..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              className="form-input"
              placeholder="San Francisco, Remote..."
              value={locationTerm}
              onChange={e => setLocationTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
          onClick={handleSearch}
        >
          🔍 Find Jobs
        </button>
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

      {externalError && !isExternalLoading && (
        <p className="text-sm text-muted mb-4" style={{ textAlign: 'center' }}>
          {externalError}
        </p>
      )}

      {combinedJobs.length > 0 && (
        <>
          <div className="stats-grid" style={{ marginBottom: '1rem' }}>
            <div className="stat-card">
              <div
                className="stat-card-icon"
                style={{ backgroundColor: '#eef2ff' }}
              >
                📋
              </div>
              <div
                className="stat-card-value"
                style={{ color: 'var(--color-primary)' }}
              >
                {filteredInternalJobs.length}
              </div>
              <div className="stat-card-label">Saved Jobs</div>
            </div>
            <div className="stat-card">
              <div
                className="stat-card-icon"
                style={{ backgroundColor: '#dbeafe' }}
              >
                🌐
              </div>
              <div className="stat-card-value" style={{ color: '#3b82f6' }}>
                {sortedExternalJobs.length}
              </div>
              <div className="stat-card-label">External Listings</div>
            </div>
          </div>
          {locationTerm.trim() && (
            <p className="text-sm text-muted mb-4">
              Results sorted by relevance to &ldquo;{locationTerm.trim()}&rdquo;
              — may include remote positions and nearby areas.
            </p>
          )}
        </>
      )}

      {combinedJobs.length > 0 ? (
        <div className="grid-2">
          {combinedJobs.map(job => (
            <div key={job.jobId} className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ margin: 0 }}>
                  {job.title}
                </h3>
                <span
                  className={`badge badge-${job.source === 'Internal' ? 'primary' : 'neutral'}`}
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
                {(() => {
                  const state = getJobState(job);
                  if (
                    state?.status === 'APPLIED' ||
                    [
                      'INTERVIEWING',
                      'OFFERED',
                      'REJECTED',
                      'WITHDRAWN',
                    ].includes(state?.status)
                  ) {
                    return <span className="badge-neutral">✓ Applied</span>;
                  }
                  if (state?.status === 'SAVED') {
                    return (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span className="badge-neutral">✓ Saved</span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleUnsave(job)}
                          disabled={unsavingJobKey === naturalKey(job)}
                        >
                          {unsavingJobKey === naturalKey(job)
                            ? 'Removing...'
                            : 'Unsave'}
                        </button>
                      </div>
                    );
                  }
                  return (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSave(job)}
                      disabled={!userId || submittingJobId === job.jobId}
                    >
                      {submittingJobId === job.jobId ? 'Saving...' : 'Save'}
                    </button>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      ) : hasSearched && !isExternalLoading ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No jobs found</div>
          <p className="empty-state-text">
            {locationTerm.trim()
              ? `No listings found in "${locationTerm.trim()}" — our provider has limited coverage outside major US/UK markets. Try removing the location, or use "Remote".`
              : 'Try different keywords or a broader location.'}
          </p>
        </div>
      ) : !hasSearched ? (
        <div className="empty-state">
          <div className="empty-state-icon">💼</div>
          <div className="empty-state-title">Ready to find your next role?</div>
          <p className="empty-state-text">
            Enter a job title or keyword above, then click Find Jobs
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default JobSearch;

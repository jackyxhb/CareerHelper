import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
      logInfo('Jobs fetched for search view', {
        items: normalized.length,
      });
    } catch (error) {
      logError('Failed to fetch jobs on web', error);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleApply = async job => {
    if (!userId) {
      setFeedback('You need to be signed in to apply.');
      return;
    }

    setSubmittingJobId(job.jobId);
    setFeedback(null);

    try {
      const isExternal = job.source && job.source !== 'Internal';

      await API.post('CareerHelperAPI', '/applications', {
        body: {
          userId,
          jobId: job.jobId,
          status: 'APPLIED',
          notes: '',
        },
      });

      setFeedback(
        isExternal
          ? `Saved ${job.title} to your tracker.`
          : `Application submitted for ${job.title}.`
      );
      logInfo('Application submitted from job search', {
        jobId: job.jobId,
        userId,
        source: job.source || 'Internal',
      });
    } catch (error) {
      setFeedback('Could not submit application. Please try again.');
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

    if (trimmedQuery.length < 3) {
      setExternalJobs([]);
      setExternalError(null);
      return;
    }

    const cacheKey = `${trimmedQuery.toLowerCase()}|${trimmedLocation.toLowerCase()}`;
    const cached = externalCacheRef.current.get(cacheKey);
    if (cached) {
      setExternalJobs(cached);
      setExternalError(null);
      logInfo('External job search cache hit', {
        query: trimmedQuery,
        location: trimmedLocation || undefined,
        items: cached.length,
      });
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
          provider: result?.provider,
          query: trimmedQuery,
          location: trimmedLocation || undefined,
          items: jobsFromSearch.length,
          cached: false,
        });
      } catch (error) {
        setExternalError('Unable to fetch external listings right now.');
        logError('Failed to fetch external jobs', error, {
          query: trimmedQuery,
          location: trimmedLocation || undefined,
        });
      } finally {
        setIsExternalLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [locationTerm, searchTerm]);

  const filteredInternalJobs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return internalJobs.filter(job =>
      job.title.toLowerCase().includes(term) ||
      job.company.toLowerCase().includes(term)
    );
  }, [internalJobs, searchTerm]);

  const combinedJobs = useMemo(
    () => [...filteredInternalJobs, ...externalJobs],
    [filteredInternalJobs, externalJobs]
  );

  return (
    <div>
      <h2>Job Search</h2>
      {feedback && <p>{feedback}</p>}
      <input
        type="text"
        placeholder="Search jobs..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      <input
        type="text"
        placeholder="Location (optional)"
        value={locationTerm}
        onChange={e => setLocationTerm(e.target.value)}
      />
      {isExternalLoading && <p>Searching external listings…</p>}
      {externalError && <p>{externalError}</p>}
      <ul>
        {combinedJobs.map(job => (
          <li key={job.jobId}>
            <h3>{job.title}</h3>
            <p>
              {job.company} - {job.location}
            </p>
            <p>{job.description}</p>
            <p>Source: {job.source || 'Internal'}</p>
            {job.externalUrl && (
              <p>
                <a href={job.externalUrl} target="_blank" rel="noreferrer">
                  View Listing
                </a>
              </p>
            )}
            <button
              type="button"
              onClick={() => handleApply(job)}
              disabled={!userId || submittingJobId === job.jobId}
            >
              {submittingJobId === job.jobId
                ? 'Submitting…'
                : job.source === 'Internal'
                  ? 'Apply'
                  : 'Save to Tracker'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default JobSearch;

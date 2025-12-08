import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { API } from 'aws-amplify';
import { logError, logInfo } from '../utils/logger';

function JobSearch({ user }) {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [submittingJobId, setSubmittingJobId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const userId = user?.username;

  const fetchJobs = useCallback(async () => {
    try {
      const jobsData = await API.get('CareerHelperAPI', '/jobs');
      setJobs(jobsData || []);
      logInfo('Jobs fetched for search view', {
        items: jobsData?.length || 0,
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
      await API.post('CareerHelperAPI', '/applications', {
        body: {
          userId,
          jobId: job.jobId,
          status: 'APPLIED',
          notes: '',
        },
      });

      setFeedback(`Application submitted for ${job.title}.`);
      logInfo('Application submitted from job search', {
        jobId: job.jobId,
        userId,
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

  const filteredJobs = useMemo(
    () =>
      jobs.filter(job => {
        const term = searchTerm.toLowerCase();
        return (
          job.title.toLowerCase().includes(term) ||
          job.company.toLowerCase().includes(term)
        );
      }),
    [jobs, searchTerm]
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
      <ul>
        {filteredJobs.map(job => (
          <li key={job.jobId}>
            <h3>{job.title}</h3>
            <p>
              {job.company} - {job.location}
            </p>
            <p>{job.description}</p>
            <button
              type="button"
              onClick={() => handleApply(job)}
              disabled={!userId || submittingJobId === job.jobId}
            >
              {submittingJobId === job.jobId ? 'Submitting…' : 'Apply'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default JobSearch;

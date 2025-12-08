import React, { useEffect, useState } from 'react';
import { API } from 'aws-amplify';
import { logError, logInfo } from '../utils/logger';

function ApplicationTracker() {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // For now, use a test user ID since authentication is disabled
      const testUserId = 'test-user-123';
      const applicationsData = await API.get(
        'CareerHelperAPI',
        `/applications/${testUserId}`
      );
      setApplications(applicationsData || []);

      const jobsData = await API.get('CareerHelperAPI', '/jobs');
      setJobs(jobsData || []);
      logInfo('Application and job data fetched', {
        applications: applicationsData?.length || 0,
        jobs: jobsData?.length || 0,
      });
    } catch (error) {
      logError('Failed to fetch application tracker data', error);
    }
  };

  const getJobTitle = jobId => {
    const job = jobs.find(j => j.jobId === jobId);
    return job ? job.title : 'Unknown Job';
  };

  return (
    <div>
      <h2>Application Tracker</h2>
      <ul>
        {applications.map(app => (
          <li key={app.applicationId}>
            <h3>{getJobTitle(app.jobId)}</h3>
            <p>Status: {app.status}</p>
            <p>Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
            {app.notes && <p>Notes: {app.notes}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ApplicationTracker;

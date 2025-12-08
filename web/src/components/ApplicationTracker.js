import React, { useEffect, useState } from 'react';
import { API } from 'aws-amplify';
import { logError, logInfo } from '../utils/logger';

function ApplicationTracker({ user }) {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const userId = user?.username;

  useEffect(() => {
    if (!userId) {
      setApplications([]);
      return;
    }

    const fetchData = async currentUserId => {
      try {
        const applicationsData = await API.get(
          'CareerHelperAPI',
          `/applications/${currentUserId}`
        );
        setApplications(applicationsData || []);

        const jobsData = await API.get('CareerHelperAPI', '/jobs');
        setJobs(jobsData || []);
        logInfo('Application and job data fetched', {
          userId: currentUserId,
          applications: applicationsData?.length || 0,
          jobs: jobsData?.length || 0,
        });
      } catch (error) {
        logError('Failed to fetch application tracker data', error, {
          userId: currentUserId,
        });
      }
    };

    fetchData(userId);
  }, [userId]);

  const getJobDetails = application => {
    const job = jobs.find(j => j.jobId === application.jobId);
    if (job) {
      return {
        title: job.title,
        company: job.company,
        location: job.location,
      };
    }

    return {
      title: application.jobTitle || 'Unknown Job',
      company: application.jobCompany || null,
      location: application.jobLocation || null,
    };
  };

  if (!userId) {
    return (
      <div>
        <h2>Application Tracker</h2>
        <p>Loading applications…</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Application Tracker</h2>
      <ul>
        {applications.map(app => {
          const details = getJobDetails(app);
          return (
            <li key={app.applicationId}>
              <h3>{details.title}</h3>
              {details.company && <p>{details.company}</p>}
              {details.location && <p>{details.location}</p>}
              <p>Status: {app.status}</p>
              <p>Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
              {app.notes && <p>Notes: {app.notes}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default ApplicationTracker;

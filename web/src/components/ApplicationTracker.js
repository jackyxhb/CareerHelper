import React, { useEffect, useState } from 'react';
import { API, Auth } from 'aws-amplify';

function ApplicationTracker() {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      const applicationsData = await API.get('CareerHelperAPI', `/applications/${currentUser.username}`);
      setApplications(applicationsData);

      const jobsData = await API.get('CareerHelperAPI', '/jobs');
      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getJobTitle = (jobId) => {
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
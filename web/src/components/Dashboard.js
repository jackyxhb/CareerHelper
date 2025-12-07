import React, { useEffect, useState } from 'react';
import { API } from 'aws-amplify';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // For now, use a test user ID since authentication is disabled
      const testUserId = 'test-user-123';

      const jobsData = await API.get('CareerHelperAPI', '/jobs');
      setJobs(jobsData || []);

      const experiencesData = await API.get(
        'CareerHelperAPI',
        `/experiences/${testUserId}`
      );
      setExperiences(experiencesData || []);

      const applicationsData = await API.get(
        'CareerHelperAPI',
        `/applications/${testUserId}`
      );
      setApplications(applicationsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div>
      <h2>Dashboard</h2>
      {user && <p>Welcome, {user.attributes.email}!</p>}

      <div>
        <h3>Recent Jobs</h3>
        <ul>
          {jobs.slice(0, 5).map(job => (
            <li key={job.jobId}>
              {job.title} at {job.company}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3>Your Experiences</h3>
        <ul>
          {experiences.map(exp => (
            <li key={exp.experienceId}>
              {exp.title} at {exp.company}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3>Application Status</h3>
        <ul>
          {applications.map(app => (
            <li key={app.applicationId}>
              Application for Job {app.jobId}: {app.status}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;

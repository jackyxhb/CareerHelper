import React, { useEffect, useState } from 'react';
import { API } from 'aws-amplify';
import { logError, logInfo } from '../utils/logger';

function Dashboard({ user, profile }) {
  const [jobs, setJobs] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    if (!user?.username) {
      setJobs([]);
      setExperiences([]);
      setApplications([]);
      return;
    }

    const fetchUserData = async userId => {
      try {
        const jobsData = await API.get('CareerHelperAPI', '/jobs');
        setJobs(jobsData || []);

        const experiencesData = await API.get(
          'CareerHelperAPI',
          `/experiences/${userId}`
        );
        setExperiences(experiencesData || []);

        const applicationsData = await API.get(
          'CareerHelperAPI',
          `/applications/${userId}`
        );
        setApplications(applicationsData || []);

        logInfo('Dashboard data refreshed', {
          userId,
          jobs: jobsData?.length || 0,
          experiences: experiencesData?.length || 0,
          applications: applicationsData?.length || 0,
        });
      } catch (error) {
        logError('Failed to fetch dashboard data', error, {
          userId,
        });
      }
    };

    fetchUserData(user.username);
  }, [user?.username]);

  return (
    <div>
      <h2>Dashboard</h2>
      {(profile?.name || user?.attributes?.email) && (
        <p>Welcome, {profile?.name || user?.attributes?.email}!</p>
      )}

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

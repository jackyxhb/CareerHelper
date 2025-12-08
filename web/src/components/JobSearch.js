import React, { useEffect, useState } from 'react';
import { API } from 'aws-amplify';
import { logError } from '../utils/logger';

function JobSearch() {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const jobsData = await API.get('CareerHelperAPI', '/jobs');
      setJobs(jobsData);
    } catch (error) {
      logError('Failed to fetch jobs on web', error);
    }
  };

  const filteredJobs = jobs.filter(
    job =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h2>Job Search</h2>
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
            <button>Apply</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default JobSearch;

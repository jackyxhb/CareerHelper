import React, { useEffect, useState } from 'react';
import { API } from 'aws-amplify';

function ExperienceManager() {
  const [experiences, setExperiences] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      // For now, use a test user ID since authentication is disabled
      const testUserId = 'test-user-123';
      const experiencesData = await API.get(
        'CareerHelperAPI',
        `/experiences/${testUserId}`
      );
      setExperiences(experiencesData || []);
    } catch (error) {
      console.error('Error fetching experiences:', error);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      await API.post('CareerHelperAPI', '/experiences', {
        body: {
          userId: currentUser.username,
          ...formData,
        },
      });
      setFormData({
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        description: '',
      });
      fetchExperiences();
    } catch (error) {
      console.error('Error creating experience:', error);
    }
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <h2>Experience Manager</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="title"
          placeholder="Job Title"
          value={formData.title}
          onChange={handleChange}
          required
        />
        <input
          name="company"
          placeholder="Company"
          value={formData.company}
          onChange={handleChange}
          required
        />
        <input
          name="startDate"
          type="date"
          value={formData.startDate}
          onChange={handleChange}
          required
        />
        <input
          name="endDate"
          type="date"
          value={formData.endDate}
          onChange={handleChange}
        />
        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          required
        />
        <button type="submit">Add Experience</button>
      </form>

      <ul>
        {experiences.map(exp => (
          <li key={exp.experienceId}>
            <h3>{exp.title}</h3>
            <p>{exp.company}</p>
            <p>
              {exp.startDate} - {exp.endDate || 'Present'}
            </p>
            <p>{exp.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ExperienceManager;

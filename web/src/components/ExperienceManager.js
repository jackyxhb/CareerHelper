import React, { useCallback, useEffect, useState } from 'react';
import { API } from 'aws-amplify';
import { logError, logInfo } from '../utils/logger';

function ExperienceManager({ user }) {
  const [experiences, setExperiences] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [feedback, setFeedback] = useState(null);

  const userId = user?.username;

  const fetchExperiences = useCallback(async currentUserId => {
    try {
      const experiencesData = await API.get(
        'CareerHelperAPI',
        `/experiences/${currentUserId}`
      );
      setExperiences(experiencesData || []);
      logInfo('Experiences fetched for web manager', {
        userId: currentUserId,
        items: experiencesData?.length || 0,
      });
    } catch (error) {
      logError('Failed to fetch experiences on web', error, {
        userId: currentUserId,
      });
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setExperiences([]);
      return;
    }

    fetchExperiences(userId);
  }, [fetchExperiences, userId]);

  const handleSubmit = async e => {
    e.preventDefault();

    if (!userId) {
      setFeedback('Sign in to add experiences.');
      return;
    }

    try {
      await API.post('CareerHelperAPI', '/experiences', {
        body: {
          userId,
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
      setFeedback('Experience saved.');
      logInfo('Experience created via web form', {
        userId,
        company: formData.company,
        title: formData.title,
      });
      fetchExperiences(userId);
    } catch (error) {
      setFeedback('Could not save experience. Please try again.');
      logError('Failed to create experience on web', error, {
        userId,
        company: formData.company,
        title: formData.title,
      });
    }
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <h2>Experience Manager</h2>

      {feedback && <p>{feedback}</p>}

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

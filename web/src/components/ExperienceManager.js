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
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div className="analytics-page">
      <div className="section-header">
        <h2>Experience Manager</h2>
        <p className="section-subtitle">Build your professional narrative</p>
      </div>

      {!userId ? (
        <div className="dashboard-card">
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <h3>Sign in to manage experiences</h3>
            <p>
              Add your work history to build a comprehensive career profile.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="dashboard-card experience-form-card">
            <h3>{isExpanded ? 'Add New Experience' : 'Add Experience'}</h3>
            <button
              type="button"
              className="btn-expand"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '−' : '+'}
            </button>

            {isExpanded && (
              <form onSubmit={handleSubmit} className="modern-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="title">Job Title</label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      placeholder="e.g. Software Engineer"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="company">Company</label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={formData.company}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startDate">Start Date</label>
                    <input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="endDate">End Date</label>
                    <input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Describe your responsibilities and achievements..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Add Experience
                  </button>
                </div>
              </form>
            )}
          </div>

          {feedback && (
            <div
              className={`alert ${feedback.includes('saved') ? 'alert-success' : 'alert-error'}`}
            >
              {feedback}
            </div>
          )}

          {experiences.length > 0 ? (
            <div className="dashboard-card">
              <h3>Your Experiences</h3>
              <ul className="experience-list">
                {experiences.map(exp => (
                  <li key={exp.experienceId} className="experience-item">
                    <div className="experience-header">
                      <h4>{exp.title}</h4>
                      <span className="experience-dates">
                        {exp.startDate} — {exp.endDate || 'Present'}
                      </span>
                    </div>
                    <p className="experience-company">{exp.company}</p>
                    <p className="experience-description">{exp.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="dashboard-card">
              <div className="empty-state">
                <div className="empty-state-icon">💼</div>
                <h3>No experiences yet</h3>
                <p>Add your first work experience to get started.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ExperienceManager;

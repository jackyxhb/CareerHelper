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
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

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
      setFeedback({ type: 'error', message: 'Sign in to add experiences.' });
      return;
    }

    setLoading(true);

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
      setShowForm(false);
      setEditingId(null);
      setFeedback({
        type: 'success',
        message: '✓ Experience added successfully!',
      });
      logInfo('Experience created via web form', {
        userId,
        company: formData.company,
        title: formData.title,
      });
      fetchExperiences(userId);

      // Clear success message after 3 seconds
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: 'Could not save experience. Please try again.',
      });
      logError('Failed to create experience on web', error, {
        userId,
        company: formData.company,
        title: formData.title,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    setFormData({
      title: '',
      company: '',
      startDate: '',
      endDate: '',
      description: '',
    });
    setShowForm(false);
    setEditingId(null);
    setFeedback(null);
  };

  const formatDateRange = (startDate, endDate) => {
    if (!startDate) return 'N/A';
    const start = new Date(startDate).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
    if (!endDate) return `${start} — Present`;
    const end = new Date(endDate).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
    return `${start} — ${end}`;
  };

  if (!userId) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Experience Manager</h1>
          <p className="page-subtitle">
            Track and showcase your professional work history
          </p>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <div className="empty-state-title">
              Sign in to manage experiences
            </div>
            <p className="empty-state-text">
              Add your work history to build a comprehensive career profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div>
            <h1 className="page-title">Experience Manager</h1>
            <p className="page-subtitle">Build your professional narrative</p>
          </div>
          {!showForm && (
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => setShowForm(true)}
              style={{ whiteSpace: 'nowrap' }}
            >
              + Add Experience
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} mb-6`}>
          {feedback.message}
        </div>
      )}

      {showForm && (
        <div className="card mb-6">
          <div
            className="card-header"
            style={{ marginBottom: 'var(--space-6)' }}
          >
            <h3 className="card-title">Add New Experience</h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-6)',
              }}
            >
              <div className="form-group">
                <label className="form-label">Job Title *</label>
                <input
                  name="title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Software Engineer"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Company *</label>
                <input
                  name="company"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acme Corp"
                  value={formData.company}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-6)',
              }}
            >
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input
                  name="startDate"
                  type="date"
                  className="form-input"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  name="endDate"
                  type="date"
                  className="form-input"
                  value={formData.endDate}
                  onChange={handleChange}
                  disabled={loading}
                />
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)',
                    marginTop: 'var(--space-2)',
                  }}
                >
                  Leave blank for current position
                </p>
              </div>
            </div>

            <div className="form-group mb-6">
              <label className="form-label">Description *</label>
              <textarea
                name="description"
                className="form-input form-textarea"
                placeholder="Describe your responsibilities and achievements..."
                value={formData.description}
                onChange={handleChange}
                required
                disabled={loading}
                rows={4}
                style={{ fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>

            <div className="flex gap-4" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Add Experience'}
              </button>
            </div>
          </form>
        </div>
      )}

      {experiences.length > 0 ? (
        <div>
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Your Experiences ({experiences.length})
            </h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 'var(--space-4)',
            }}
          >
            {experiences.map(exp => (
              <div
                key={exp.experienceId}
                className="card"
                style={{ position: 'relative' }}
              >
                <div className="card-header">
                  <div>
                    <h3
                      className="card-title"
                      style={{
                        fontSize: '1.125rem',
                        marginBottom: 'var(--space-1)',
                      }}
                    >
                      {exp.title}
                    </h3>
                    <p
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontWeight: 500,
                        margin: 0,
                      }}
                    >
                      {exp.company}
                    </p>
                  </div>
                  <span className="badge badge-primary">
                    {formatDateRange(exp.startDate, exp.endDate)}
                  </span>
                </div>

                <p
                  style={{
                    color: 'var(--color-text-secondary)',
                    marginTop: 'var(--space-4)',
                    marginBottom: 'var(--space-4)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {exp.description}
                </p>

                <div
                  className="flex gap-2"
                  style={{
                    justifyContent: 'flex-end',
                    borderTop: '1px solid var(--color-gray-100)',
                    paddingTop: 'var(--space-4)',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setFormData({
                        title: exp.title,
                        company: exp.company,
                        startDate: exp.startDate,
                        endDate: exp.endDate || '',
                        description: exp.description,
                      });
                      setEditingId(exp.experienceId);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💼</div>
            <div className="empty-state-title">No experiences yet</div>
            <p className="empty-state-text">
              Add your first work experience to get started building your
              professional profile.
            </p>
            {!showForm && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                Add Your First Experience
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExperienceManager;

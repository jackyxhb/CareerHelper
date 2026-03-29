import React, { useCallback, useEffect, useRef, useState } from 'react';
import { API } from 'aws-amplify';
import { logError, logInfo } from '../utils/logger';

const SUGGESTED_ROLES = [
  'Software Engineer',
  'Full Stack Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Data Engineer',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Product Manager',
  'UX Designer',
  'Engineering Manager',
];

function ProfileSettings({ user, profile, onProfileUpdated }) {
  const [preferredName, setPreferredName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [jobPreferences, setJobPreferences] = useState([]);
  const [roleInput, setRoleInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const initializedRef = useRef(false);

  // Populate form from profile when it first loads
  useEffect(() => {
    if (!profile || initializedRef.current) return;
    initializedRef.current = true;
    setPreferredName(profile.preferredName || '');
    setCity(profile.city || '');
    setCountry(profile.country || '');
    setJobPreferences(profile.jobPreferences || []);
  }, [profile]);

  const addRole = useCallback(() => {
    const trimmed = roleInput.trim();
    if (!trimmed || jobPreferences.includes(trimmed)) {
      setRoleInput('');
      return;
    }
    setJobPreferences(prev => [...prev, trimmed]);
    setRoleInput('');
  }, [roleInput, jobPreferences]);

  const removeRole = useCallback(role => {
    setJobPreferences(prev => prev.filter(r => r !== role));
  }, []);

  const addSuggested = useCallback(
    role => {
      if (!jobPreferences.includes(role)) {
        setJobPreferences(prev => [...prev, role]);
      }
    },
    [jobPreferences]
  );

  const handleRoleKeyDown = useCallback(
    e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addRole();
      }
    },
    [addRole]
  );

  const handleSave = useCallback(async () => {
    if (!user) return;
    const userId = user.username;

    setIsSaving(true);
    setFeedback(null);

    try {
      await API.put('CareerHelperAPI', `/users/${userId}`, {
        body: { preferredName, city, country, jobPreferences },
      });

      logInfo('Profile updated', { userId });

      if (onProfileUpdated) {
        onProfileUpdated({ ...profile, preferredName, city, country, jobPreferences });
      }

      setFeedback({ type: 'success', message: 'Profile saved successfully.' });
    } catch (error) {
      logError('Failed to save profile', error, { userId });
      setFeedback({ type: 'error', message: 'Could not save profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  }, [user, profile, preferredName, city, country, jobPreferences, onProfileUpdated]);

  if (!profile) {
    return (
      <div className="page-container">
        <div className="card text-center p-6">
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p className="mt-4 text-muted">Loading profile…</p>
        </div>
      </div>
    );
  }

  const unusedSuggestions = SUGGESTED_ROLES.filter(r => !jobPreferences.includes(r));

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-subtitle">
          Tell us about yourself so we can personalise your job search.
        </p>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} mb-6`}>{feedback.message}</div>
      )}

      <div className="card mb-6">
        <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>
          Personal Info
        </h2>

        <div className="form-group">
          <label className="form-label">Account Name</label>
          <input
            type="text"
            className="form-input"
            value={profile.name || ''}
            disabled
            style={{ backgroundColor: 'var(--color-bg)', cursor: 'not-allowed' }}
          />
          <p className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>
            Managed by your sign-in provider.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Preferred Display Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="How should we address you?"
            value={preferredName}
            onChange={e => setPreferredName(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">City</label>
            <input
              type="text"
              className="form-input"
              placeholder="Auckland, San Francisco…"
              value={city}
              onChange={e => setCity(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Country</label>
            <input
              type="text"
              className="form-input"
              placeholder="New Zealand, United States…"
              value={country}
              onChange={e => setCountry(e.target.value)}
              maxLength={100}
            />
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="card-title" style={{ marginBottom: '0.5rem' }}>
          Job Preferences
        </h2>
        <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
          Roles you are seeking. These pre-fill your job search automatically.
        </p>

        {jobPreferences.length > 0 && (
          <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
            {jobPreferences.map(role => (
              <span
                key={role}
                className="badge badge-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {role}
                <button
                  type="button"
                  onClick={() => removeRole(role)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 1,
                    color: 'inherit',
                    fontSize: '0.9em',
                  }}
                  aria-label={`Remove ${role}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">Add a role</label>
            <input
              type="text"
              className="form-input"
              placeholder="Type a job title and press Enter"
              value={roleInput}
              onChange={e => setRoleInput(e.target.value)}
              onKeyDown={handleRoleKeyDown}
              maxLength={100}
            />
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={addRole}
            style={{ whiteSpace: 'nowrap' }}
          >
            + Add
          </button>
        </div>

        {unusedSuggestions.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
              Common roles:
            </p>
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              {unusedSuggestions.map(role => (
                <button
                  key={role}
                  type="button"
                  className="badge badge-neutral"
                  style={{ cursor: 'pointer', border: '1px dashed var(--color-border)' }}
                  onClick={() => addSuggested(role)}
                >
                  + {role}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}

export default ProfileSettings;

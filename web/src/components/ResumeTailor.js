import React, { useState } from 'react';
import { API } from 'aws-amplify';
import { analytics, AnalyticsEvent } from '../utils/analytics';
import config from '../amplify-config.json';

function ResumeTailor() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();

    if (!resumeText.trim() || !jobDescription.trim()) {
      setError('Please provide both resume and job description');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    analytics.track('resume_tailoring_started', {
      resume_length: resumeText.length,
      job_description_length: jobDescription.length,
    });

    try {
      const response = await API.post('CareerHelperAPI', '/resume/tailor', {
        body: {
          resumeText,
          jobDescription,
          jobTitle,
          companyName,
        },
      });

      setResults(response);
      analytics.track(AnalyticsEvent.RESUME_TAILORED, {
        overall_score: response.overallScore,
        keywords_added: response.keywordsAdded?.length || 0,
        sections_count: response.sections?.length || 0,
      });
    } catch (err) {
      setError('Failed to tailor resume. Please try again.');
      analytics.trackError(err, { feature: 'resume_tailoring' });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = score => {
    if (score >= 70) return '#4caf50';
    if (score >= 50) return '#ff9800';
    return '#f44336';
  };

  const getScoreMessage = score => {
    if (score >= 70) return 'Strong Match';
    if (score >= 50) return 'Moderate Match';
    return 'Needs Work';
  };

  const scoreColor = results ? getScoreColor(results.overallScore) : '#6366f1';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">AI Resume Tailor</h1>
        <p className="page-subtitle">
          Paste your resume and a job description to get personalized
          suggestions
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card mb-6">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-6)',
            }}
          >
            <div className="form-group">
              <label className="form-label">Job Title (optional)</label>
              <input
                type="text"
                className="form-input"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Company Name (optional)</label>
              <input
                type="text"
                className="form-input"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g., Google"
              />
            </div>
          </div>

          <div className="form-group mb-6">
            <label className="form-label">Your Resume</label>
            <textarea
              className="form-input form-textarea"
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              rows={6}
              style={{ fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div className="form-group mb-6">
            <label className="form-label">Job Description</label>
            <textarea
              className="form-input form-textarea"
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={6}
              style={{ fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          {error && <div className="alert alert-error mb-6">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
          >
            {loading ? '🔄 Analyzing...' : '✨ Tailor My Resume'}
          </button>
        </div>
      </form>

      {loading && (
        <div
          className="card"
          style={{ textAlign: 'center', padding: 'var(--space-8)' }}
        >
          <div
            className="loading-spinner"
            style={{ margin: '0 auto', marginBottom: 'var(--space-4)' }}
          />
          <p className="text-muted">Analyzing your resume…</p>
        </div>
      )}

      {results && (
        <div style={{ marginTop: 'var(--space-8)' }}>
          <div className="card mb-6">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                padding: 'var(--space-6)',
                backgroundColor: '#f9fafb',
                borderRadius: 'var(--radius)',
                marginBottom: 'var(--space-6)',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: scoreColor,
                }}
              >
                {results.overallScore}%
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  {getScoreMessage(results.overallScore)}
                </div>
                <div
                  style={{
                    fontSize: '0.95rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {results.summary}
                </div>
              </div>
            </div>

            {results.keywordsAdded?.length > 0 && (
              <div
                style={{
                  padding: 'var(--space-4)',
                  backgroundColor: '#f0fdf4',
                  borderLeft: '4px solid var(--color-success)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 'var(--space-3)',
                    color: '#059669',
                  }}
                >
                  Keywords to Add
                </div>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {results.keywordsAdded.map((kw, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                      }}
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {results.suggestions?.length > 0 && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div
                  style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}
                >
                  💡 Suggestions
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: 'var(--space-2)',
                  }}
                >
                  {results.suggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 'var(--space-3)',
                        backgroundColor: '#fef3c7',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.95rem',
                        color: '#78350f',
                        borderLeft: '4px solid #f59e0b',
                      }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.sections?.length > 0 && (
              <div>
                <div
                  style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}
                >
                  📊 Section-by-Section Analysis
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: 'var(--space-3)',
                  }}
                >
                  {results.sections.map((section, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 'var(--space-4)',
                        backgroundColor: '#f9fafb',
                        borderLeft: `4px solid ${getScoreColor(section.matchScore)}`,
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 'var(--space-2)',
                        }}
                      >
                        Section {i + 1} — Match: {section.matchScore}%
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: '1.5rem',
                          fontSize: '0.9rem',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {section.changes.map((change, j) => (
                          <li key={j} style={{ marginBottom: '0.5rem' }}>
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeTailor;

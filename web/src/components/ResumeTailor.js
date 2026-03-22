import React, { useState } from 'react';
import { API } from 'aws-amplify';
import { analytics, AnalyticsEvent } from '../utils/analytics';
import config from '../amplify-config.json';

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '8px',
  },
  textarea: {
    width: '100%',
    minHeight: '150px',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    marginBottom: '16px',
  },
  jobDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  results: {
    marginTop: '24px',
  },
  scoreCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '20px',
    backgroundColor: '#f0f7ff',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  scoreCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
  },
  scoreDetails: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  scoreDescription: {
    fontSize: '14px',
    color: '#666',
  },
  section: {
    marginBottom: '16px',
    padding: '16px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    borderLeft: '4px solid #1976d2',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
  },
  change: {
    fontSize: '13px',
    color: '#666',
    marginLeft: '12px',
  },
  keywords: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  },
  keyword: {
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '500',
  },
  keywordAdded: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  keywordRemoved: {
    backgroundColor: '#ffebee',
    color: '#c62828',
  },
  suggestion: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#fff8e1',
    borderRadius: '8px',
    marginBottom: '8px',
  },
  suggestionIcon: {
    fontSize: '16px',
  },
  suggestionText: {
    fontSize: '14px',
    color: '#333',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  error: {
    padding: '16px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    borderRadius: '8px',
    marginBottom: '16px',
  },
};

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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>AI Resume Tailor</h2>
        <p style={styles.subtitle}>
          Paste your resume and a job description to get personalized
          suggestions
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={styles.card}>
          <div style={styles.jobDetails}>
            <div>
              <label style={styles.label}>Job Title (optional)</label>
              <input
                type="text"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Company Name (optional)</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g., Google"
                style={styles.input}
              />
            </div>
          </div>

          <div>
            <label style={styles.label}>Your Resume</label>
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              style={styles.textarea}
            />
          </div>

          <div>
            <label style={styles.label}>Job Description</label>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              style={styles.textarea}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? 'Analyzing...' : 'Tailor My Resume'}
          </button>
        </div>
      </form>

      {loading && (
        <div style={styles.loading}>
          <div>🔄 Analyzing your resume...</div>
        </div>
      )}

      {results && (
        <div style={styles.results}>
          <div style={styles.card}>
            <div style={styles.scoreCard}>
              <div
                style={{
                  ...styles.scoreCircle,
                  backgroundColor: getScoreColor(results.overallScore),
                }}
              >
                {results.overallScore}%
              </div>
              <div style={styles.scoreDetails}>
                <div style={styles.scoreTitle}>
                  {getScoreMessage(results.overallScore)}
                </div>
                <div style={styles.scoreDescription}>{results.summary}</div>
              </div>
            </div>

            {results.keywordsAdded?.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>Keywords to Add</div>
                <div style={styles.keywords}>
                  {results.keywordsAdded.map((kw, i) => (
                    <span
                      key={i}
                      style={{ ...styles.keyword, ...styles.keywordAdded }}
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {results.suggestions?.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>Suggestions</div>
                {results.suggestions.map((suggestion, i) => (
                  <div key={i} style={styles.suggestion}>
                    <span style={styles.suggestionIcon}>💡</span>
                    <span style={styles.suggestionText}>{suggestion}</span>
                  </div>
                ))}
              </div>
            )}

            {results.sections?.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  Section-by-Section Analysis
                </div>
                {results.sections.map((section, i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.section,
                      borderLeftColor: getScoreColor(section.matchScore),
                    }}
                  >
                    <div style={styles.sectionTitle}>
                      Section {i + 1} (Match: {section.matchScore}%)
                    </div>
                    {section.changes.map((change, j) => (
                      <div key={j} style={styles.change}>
                        • {change}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeTailor;

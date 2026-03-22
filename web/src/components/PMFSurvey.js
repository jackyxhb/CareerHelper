import React, { useState } from 'react';
import { analytics, AnalyticsEvent } from '../utils/analytics';

const styles = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 999,
  },
  trigger: {
    padding: '12px 20px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '24px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'transform 0.2s',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '480px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
  },
  question: {
    marginBottom: '24px',
  },
  questionText: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '12px',
  },
  scoreButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  scoreButton: {
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
    backgroundColor: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  scoreButtonSelected: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
    color: 'white',
  },
  textarea: {
    width: '100%',
    minHeight: '100px',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  checkboxInput: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: '14px',
    color: '#333',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  primaryButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  secondaryButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: 'white',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  thankYou: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  thankYouEmoji: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  thankYouTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  thankYouText: {
    fontSize: '16px',
    color: '#666',
  },
};

const PMF_QUESTION =
  'How would you feel if you could no longer use CareerHelper?';
const USE_CASE_QUESTION = "What's your primary use case for CareerHelper?";
const IMPROVEMENTS_QUESTION = 'What would you most want us to improve?';
const WOULD_REFER_QUESTION = 'Would you recommend CareerHelper to a friend?';

function PMFSurvey({ userId, onDismiss }) {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [useCase, setUseCase] = useState('');
  const [improvements, setImprovements] = useState([]);
  const [wouldRefer, setWouldRefer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    analytics.track('pmf_survey_submitted', {
      score,
      use_case: useCase,
      improvements: improvements.join(', '),
      would_refer: wouldRefer,
      has_feedback: !!feedback,
    });

    try {
      await fetch('/api/pmf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          score,
          feedback,
          useCase,
          improvements,
          wouldRefer,
        }),
      });
    } catch (error) {
      console.error('Failed to submit PMF survey:', error);
    }

    setSubmitted(true);
    setLoading(false);
  };

  const toggleImprovement = item => {
    setImprovements(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const getScoreColor = s => {
    if (s <= 6) return '#f44336';
    if (s <= 8) return '#ff9800';
    return '#4caf50';
  };

  if (submitted) {
    return (
      <div style={styles.modal} onClick={onDismiss}>
        <div style={styles.content} onClick={e => e.stopPropagation()}>
          <div style={styles.thankYou}>
            <div style={styles.thankYouEmoji}>
              {score >= 9 ? '🎉' : score >= 7 ? '🙏' : '💪'}
            </div>
            <div style={styles.thankYouTitle}>Thank you!</div>
            <div style={styles.thankYouText}>
              {score >= 9
                ? "We're thrilled you love CareerHelper!"
                : score >= 7
                  ? "Thanks for your feedback. We'll keep improving!"
                  : "Thanks for being honest. We're committed to making CareerHelper better."}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.modal} onClick={onDismiss}>
      <div style={styles.content} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.title}>Quick Feedback</div>
          <div style={styles.subtitle}>Help us improve CareerHelper</div>
        </div>

        {step === 0 && (
          <div style={styles.question}>
            <div style={styles.questionText}>{PMF_QUESTION}</div>
            <div style={styles.scoreButtons}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                <button
                  key={s}
                  onClick={() => setScore(s)}
                  style={{
                    ...styles.scoreButton,
                    ...(score === s ? styles.scoreButtonSelected : {}),
                    ...(score === s
                      ? {
                          backgroundColor: getScoreColor(s),
                          borderColor: getScoreColor(s),
                        }
                      : {}),
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div
              style={{
                marginTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#999',
              }}
            >
              <span>Very disappointed</span>
              <span>Very disappointed</span>
              <span>Very disappointed</span>
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={styles.question}>
            <div style={styles.questionText}>{USE_CASE_QUESTION}</div>
            <select
              value={useCase}
              onChange={e => setUseCase(e.target.value)}
              style={styles.select}
            >
              <option value="">Select your primary use case...</option>
              <option value="job-tracking">Job Application Tracking</option>
              <option value="resume-building">Resume Building</option>
              <option value="interview-prep">Interview Preparation</option>
              <option value="career-planning">Career Planning</option>
              <option value="skill-assessment">Skill Assessment</option>
              <option value="network-building">Network Building</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        {step === 2 && (
          <div style={styles.question}>
            <div style={styles.questionText}>{IMPROVEMENTS_QUESTION}</div>
            <div style={styles.checkboxGroup}>
              {[
                'Better job search',
                'More integrations',
                'Mobile experience',
                'AI recommendations',
                'Interview tools',
                'Better analytics',
                'Other',
              ].map(item => (
                <label key={item} style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={improvements.includes(item)}
                    onChange={() => toggleImprovement(item)}
                    style={styles.checkboxInput}
                  />
                  <span style={styles.checkboxLabel}>{item}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={styles.question}>
            <div style={styles.questionText}>Any other feedback?</div>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Tell us what you think..."
              style={styles.textarea}
            />
          </div>
        )}

        <div style={styles.buttonGroup}>
          {step > 0 && (
            <button
              style={styles.secondaryButton}
              onClick={() => setStep(step - 1)}
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              style={styles.primaryButton}
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && score === null}
            >
              Next
            </button>
          ) : (
            <button
              style={styles.primaryButton}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PMFSurvey;

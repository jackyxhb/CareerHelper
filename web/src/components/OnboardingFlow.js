import React, { useState } from 'react';
import { analytics, AnalyticsEvent } from '../utils/analytics';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to CareerHelper',
    description:
      "Your all-in-one career management platform. Let's get you set up in just 2 minutes.",
    icon: '👋',
  },
  {
    id: 'profile',
    title: 'Build Your Profile',
    description:
      'Add your work experience, skills, and education. This helps us recommend the best opportunities.',
    action: 'navigate_experiences',
  },
  {
    id: 'first_job',
    title: 'Find Your Next Role',
    description:
      'Search thousands of jobs or let our AI find matches based on your profile.',
    action: 'navigate_jobs',
  },
  {
    id: 'complete',
    title: "You're All Set!",
    description:
      'Start tracking your applications and land your dream job. Good luck!',
    action: 'navigate_dashboard',
  },
];

function OnboardingFlow({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const step = ONBOARDING_STEPS[currentStep];

  const handleNext = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    analytics.trackFunnelStep(step.id, { direction: 'next' });

    setTimeout(() => {
      if (currentStep < ONBOARDING_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
      setIsAnimating(false);
    }, 300);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      analytics.trackFunnelStep(step.id, { direction: 'back' });

      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleComplete = () => {
    analytics.track(AnalyticsEvent.ONBOARDING_COMPLETED, {
      steps_completed: currentStep + 1,
      total_steps: ONBOARDING_STEPS.length,
    });
    onComplete?.();
  };

  const handleAction = () => {
    if (step.action) {
      const routes = {
        navigate_experiences: '/experiences',
        navigate_jobs: '/jobs',
        navigate_dashboard: '/',
      };
      window.location.href = routes[step.action] || '/';
    }
    handleNext();
  };

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>

        <button
          style={styles.skipButton}
          onClick={onSkip}
          aria-label="Skip onboarding"
        >
          Skip
        </button>

        <div style={{ ...styles.content, opacity: isAnimating ? 0 : 1 }}>
          <div style={styles.icon}>{step.icon}</div>
          <h2 style={styles.title}>{step.title}</h2>
          <p style={styles.description}>{step.description}</p>

          {step.action && (
            <button onClick={handleAction} style={styles.actionButton}>
              Get Started
            </button>
          )}
        </div>

        <div style={styles.footer}>
          <div style={styles.dots}>
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                style={{
                  ...styles.dot,
                  ...(index === currentStep ? styles.dotActive : {}),
                }}
              />
            ))}
          </div>

          <div style={styles.navigation}>
            {currentStep > 0 && (
              <button onClick={handleBack} style={styles.navButton}>
                Back
              </button>
            )}
            {!step.action && (
              <button onClick={handleNext} style={styles.navButtonPrimary}>
                {currentStep === ONBOARDING_STEPS.length - 1
                  ? 'Finish'
                  : 'Next'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  container: {
    maxWidth: '480px',
    width: '100%',
    padding: '40px',
    textAlign: 'center',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    backgroundColor: '#e0e0e0',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1976d2',
    transition: 'width 0.3s ease',
  },
  skipButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    fontSize: '14px',
  },
  content: {
    transition: 'opacity 0.3s ease',
    minHeight: '300px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: '64px',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '12px',
  },
  description: {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.5',
    marginBottom: '32px',
  },
  actionButton: {
    padding: '14px 32px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  footer: {
    marginTop: '40px',
  },
  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '24px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0',
    transition: 'all 0.3s ease',
  },
  dotActive: {
    backgroundColor: '#1976d2',
    width: '24px',
    borderRadius: '4px',
  },
  navigation: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
  },
  navButton: {
    padding: '10px 24px',
    backgroundColor: 'white',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  navButtonPrimary: {
    padding: '10px 24px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
};

export default OnboardingFlow;

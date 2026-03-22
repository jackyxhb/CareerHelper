const AnalyticsEvent = {
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
  JOB_SEARCHED: 'job_searched',
  JOB_SAVED: 'job_saved',
  JOB_APPLICATION_STARTED: 'job_application_started',
  JOB_APPLICATION_SUBMITTED: 'job_application_submitted',
  EXPERIENCE_ADDED: 'experience_added',
  EXPERIENCE_UPDATED: 'experience_updated',
  RESUME_UPLOADED: 'resume_uploaded',
  RESUME_TAILORED: 'resume_tailored',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  DASHBOARD_VIEWED: 'dashboard_viewed',
  ANALYTICS_VIEWED: 'analytics_viewed',
  ERROR_OCCURRED: 'error_occurred',
};

class AnalyticsService {
  constructor() {
    this.userId = null;
    this.sessionId = this.generateSessionId();
    this.queue = [];
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  identify(userId, traits = {}) {
    this.userId = userId;
    this.track(AnalyticsEvent.USER_SIGNED_IN, {
      user_id: userId,
      ...traits,
    });
  }

  reset() {
    this.userId = null;
    this.sessionId = this.generateSessionId();
  }

  track(event, properties = {}) {
    const payload = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        session_id: this.sessionId,
        user_id: this.userId,
        platform: 'web',
        app_version: process.env.REACT_APP_VERSION || '1.0.0',
      },
    };

    if (!this.isEnabled) {
      console.log('[Analytics]', event, payload.properties);
      return;
    }

    this.queue.push(payload);
    this.flush();
  }

  async flush() {
    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];

    try {
      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
      });
    } catch (error) {
      console.error('[Analytics] Failed to send events:', error);
      this.queue.unshift(...batch);
    }
  }

  trackPageView(pageName, properties = {}) {
    this.track(`page_viewed_${pageName}`, {
      page: pageName,
      ...properties,
    });
  }

  trackFunnelStep(stepName, properties = {}) {
    this.track(`funnel_step_${stepName}`, {
      funnel_name: 'user_activation',
      step: stepName,
      ...properties,
    });
  }

  trackConversion(conversionType, properties = {}) {
    this.track('conversion', {
      conversion_type: conversionType,
      ...properties,
    });
  }

  trackError(error, context = {}) {
    this.track(AnalyticsEvent.ERROR_OCCURRED, {
      error_message: error.message || String(error),
      error_stack: error.stack,
      ...context,
    });
  }
}

const analytics = new AnalyticsService();

export { analytics, AnalyticsEvent };
export default analytics;

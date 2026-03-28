import { AnalyticsEvent } from '../../../shared/src';

export const MOBILE_EVENTS = {
  ...AnalyticsEvent,
  SCREEN_VIEWED: 'screen_viewed',
  APP_OPENED: 'app_opened',
  APP_BACKGROUNDED: 'app_backgrounded',
  OFFLINE_SYNC_COMPLETED: 'offline_sync_completed',
  OFFLINE_SYNC_FAILED: 'offline_sync_failed',
  RESUME_DOWNLOADED: 'resume_downloaded',
};

class MobileAnalytics {
  constructor() {
    this.userId = null;
    this.sessionId = this.generateSessionId();
    this.isEnabled = __DEV__ !== true;
    this.queue = [];
  }

  generateSessionId() {
    return `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  identify(userId, traits = {}) {
    this.userId = userId;
    this.track(MOBILE_EVENTS.USER_SIGNED_IN, {
      user_id: userId,
      platform: 'mobile',
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
        platform: 'mobile',
        app_version: '1.0.0',
        device_id: this.getDeviceId(),
      },
    };

    if (__DEV__) {
      console.log('[Analytics]', event, payload.properties);
      return;
    }

    this.queue.push(payload);
    this.flush();
  }

  getDeviceId() {
    return `device_${Math.random().toString(36).substr(2, 9)}`;
  }

  async flush() {
    if (this.queue.length === 0 || __DEV__) return;

    const batch = [...this.queue];
    this.queue = [];

    try {
      await fetch('https://api.careerhelper.app/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
      });
    } catch (error) {
      console.error('[Analytics] Failed to send:', error);
      this.queue.unshift(...batch);
    }
  }

  trackScreen(screenName, properties = {}) {
    this.track(MOBILE_EVENTS.SCREEN_VIEWED, {
      screen: screenName,
      ...properties,
    });
  }

  trackOfflineSync(success, properties = {}) {
    this.track(
      success
        ? MOBILE_EVENTS.OFFLINE_SYNC_COMPLETED
        : MOBILE_EVENTS.OFFLINE_SYNC_FAILED,
      properties
    );
  }

  trackError(error, context = {}) {
    this.track(MOBILE_EVENTS.ERROR_OCCURRED, {
      error_message: error.message || String(error),
      error_stack: error.stack,
      ...context,
    });
  }
}

const analytics = new MobileAnalytics();
export default analytics;

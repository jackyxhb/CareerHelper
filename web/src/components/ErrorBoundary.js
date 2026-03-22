import React from 'react';
import { logError } from './logger';
import { analytics, AnalyticsEvent } from './analytics';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    logError('React Error Boundary caught error', error, {
      componentStack: errorInfo?.componentStack,
      errorBoundary: true,
    });

    analytics.trackError(error, {
      component_stack: errorInfo?.componentStack,
      boundary_name: this.props.name || 'UnnamedBoundary',
    });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleDismiss = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          reload: this.handleReload,
          dismiss: this.handleDismiss,
        });
      }

      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.message}>
              We encountered an unexpected error. Please try refreshing the
              page.
            </p>
            <div style={styles.actions}>
              <button onClick={this.handleReload} style={styles.primaryButton}>
                Refresh Page
              </button>
              {this.props.onReport && (
                <button
                  onClick={this.props.onReport}
                  style={styles.secondaryButton}
                >
                  Report Issue
                </button>
              )}
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={styles.details}>
                <summary>Error Details</summary>
                <pre>{this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    backgroundColor: '#f5f5f5',
  },
  content: {
    maxWidth: '500px',
    padding: '30px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.5rem',
    color: '#d32f2f',
    marginBottom: '10px',
  },
  message: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '20px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
  },
  primaryButton: {
    padding: '10px 20px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  secondaryButton: {
    padding: '10px 20px',
    backgroundColor: 'white',
    color: '#1976d2',
    border: '1px solid #1976d2',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  details: {
    marginTop: '20px',
    textAlign: 'left',
    fontSize: '0.8rem',
    color: '#666',
  },
};

export default ErrorBoundary;

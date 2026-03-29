import React, { useState } from 'react';
import { Auth } from 'aws-amplify';
import { logError, logInfo } from '../utils/logger';

function AuthSignIn({ onAuthStateChange }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSignUp, setShowSignUp] = useState(false);

  const handleSignIn = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await Auth.signIn(email, password);
      logInfo('User signed in successfully', { email });
      onAuthStateChange();
    } catch (err) {
      const message =
        err.message || 'Sign in failed. Please check your credentials.';
      setError(message);
      logError('Sign in failed', err, { email });
    } finally {
      setLoading(false);
    }
  };

  if (showSignUp) {
    return (
      <AuthSignUp
        onSignUpComplete={() => {
          setShowSignUp(false);
          setEmail('');
          setPassword('');
        }}
        onBackToSignIn={() => setShowSignUp(false)}
      />
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your CareerHelper account</p>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSignIn} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            Don't have an account?{' '}
            <button
              type="button"
              className="auth-link"
              onClick={() => setShowSignUp(true)}
              disabled={loading}
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function AuthSignUp({ onSignUpComplete, onBackToSignIn }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmationCode, setConfirmationCode] = useState(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleSignUp = async e => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await Auth.signUp({
        username: formData.email,
        password: formData.password,
        attributes: {
          email: formData.email,
          name: formData.name,
        },
      });
      logInfo('User signed up successfully', { email: formData.email });
      setConfirmationCode(true);
    } catch (err) {
      const message =
        err.message || 'Sign up failed. Please try again.';
      setError(message);
      logError('Sign up failed', err, { email: formData.email });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async e => {
    e.preventDefault();
    setError(null);
    setConfirmLoading(true);

    try {
      await Auth.confirmSignUp(formData.email, confirmCode);
      logInfo('Email confirmed', { email: formData.email });
      onSignUpComplete();
    } catch (err) {
      const message =
        err.message || 'Confirmation failed. Please check the code.';
      setError(message);
      logError('Confirm sign up failed', err, { email: formData.email });
    } finally {
      setConfirmLoading(false);
    }
  };

  if (confirmationCode) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Confirm Your Email</h1>
            <p className="auth-subtitle">
              We sent a confirmation code to {formData.email}
            </p>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleConfirmSignUp} className="auth-form">
            <div className="form-group">
              <label className="form-label">Confirmation Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="000000"
                value={confirmCode}
                onChange={e => setConfirmCode(e.target.value)}
                required
                disabled={confirmLoading}
                maxLength="6"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={confirmLoading}
            >
              {confirmLoading ? 'Confirming...' : 'Confirm Email'}
            </button>
          </form>

          <div className="auth-footer">
            <button
              type="button"
              className="auth-link"
              onClick={() => {
                setConfirmationCode(null);
                setFormData({
                  email: '',
                  password: '',
                  passwordConfirm: '',
                  name: '',
                });
              }}
              disabled={confirmLoading}
            >
              ← Back to sign up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Get Started</h1>
          <p className="auth-subtitle">Create your CareerHelper account</p>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="John Doe"
              value={formData.name}
              onChange={e =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={e =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={e =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              disabled={loading}
            />
            <p className="form-hint">
              At least 8 characters, with uppercase, lowercase, number, and special character
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.passwordConfirm}
              onChange={e =>
                setFormData({ ...formData, passwordConfirm: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            Already have an account?{' '}
            <button
              type="button"
              className="auth-link"
              onClick={onBackToSignIn}
              disabled={loading}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuthContainer({ isSignedIn, signOut }) {
  if (isSignedIn) {
    return null;
  }

  return <AuthSignIn onAuthStateChange={() => window.location.reload()} />;
}

export default AuthSignIn;

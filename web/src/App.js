import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
} from 'react-router-dom';
import { Amplify, API, Auth } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import config from './amplify-config.json';
import Dashboard from './components/Dashboard';
import JobSearch from './components/JobSearch';
import ExperienceManager from './components/ExperienceManager';
import ApplicationTracker from './components/ApplicationTracker';
import AnalyticsPage from './components/AnalyticsPage';
import ResumeManager from './components/ResumeManager';
import ResumeTailor from './components/ResumeTailor';
import ProfileSettings from './components/ProfileSettings';
import ErrorBoundary from './components/ErrorBoundary';
import OnboardingFlow from './components/OnboardingFlow';
import analytics, { AnalyticsEvent } from './utils/analytics';
import { logError, logInfo } from './utils/logger';

Amplify.configure({
  Auth: {
    region: config.region,
    userPoolId: config.userPoolId,
    userPoolWebClientId: config.userPoolWebClientId,
    mandatorySignIn: true,
  },
  API: {
    endpoints: [
      {
        name: 'CareerHelperAPI',
        endpoint: config.apiEndpoint,
        region: config.region,
        custom_header: async () => {
          try {
            const session = await Auth.currentSession();
            const token = session.getIdToken().getJwtToken();

            return {
              Authorization: `Bearer ${token}`,
            };
          } catch (error) {
            logError('Failed to resolve auth token for API request', error);
            return {};
          }
        },
      },
    ],
  },
});

const deriveDisplayName = user =>
  user?.attributes?.name || user?.attributes?.given_name || user?.username;

const extractStatusCode = error =>
  error?.response?.status ??
  error?.response?.statusCode ??
  error?.status ??
  error?.$metadata?.httpStatusCode;

async function fetchOrCreateUserProfile(user) {
  const userId = user.username;

  try {
    const profile = await API.get('CareerHelperAPI', `/users/${userId}`);
    logInfo('User profile loaded', { userId });
    return profile;
  } catch (error) {
    const status = extractStatusCode(error);

    if (status === 404) {
      const newProfile = {
        userId,
        email: user.attributes?.email || '',
        name: deriveDisplayName(user),
      };

      await API.post('CareerHelperAPI', '/users', { body: newProfile });
      logInfo('User profile created', { userId });
      const createdProfile = await API.get(
        'CareerHelperAPI',
        `/users/${userId}`
      );
      return createdProfile;
    }

    throw error;
  }
}

function App({ user, signOut }) {
  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding_complete', 'true');
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem('onboarding_complete', 'true');
    setShowOnboarding(false);
  };

  useEffect(() => {
    let isMounted = true;

    if (user) {
      const hasSeenOnboarding = localStorage.getItem('onboarding_complete');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
      analytics.identify(user.username);
    }

    const bootstrapProfile = async () => {
      if (!user) {
        if (isMounted) {
          setProfile(null);
        }
        return;
      }

      setIsProfileLoading(true);

      try {
        const syncedProfile = await fetchOrCreateUserProfile(user);
        if (isMounted) {
          setProfile(syncedProfile);
        }
      } catch (error) {
        logError('Failed to synchronize user profile', error, {
          userId: user.username,
        });
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    };

    bootstrapProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <div className="App-header-content">
            <div>
              <h1>CareerHelper</h1>
              {profile?.name && <p>Signed in as {profile.name}</p>}
            </div>
            <button type="button" onClick={signOut} className="sign-out-btn">
              Sign out
            </button>
          </div>
          <nav>
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/jobs"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Jobs
            </NavLink>
            <NavLink
              to="/experiences"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Experiences
            </NavLink>
            <NavLink
              to="/applications"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Applications
            </NavLink>
            <NavLink
              to="/resume-tailor"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              AI Resume Tailor
            </NavLink>
            <NavLink
              to="/resumes"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Resumes
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Profile
            </NavLink>
          </nav>
        </header>
        <main className="App-main">
          {isProfileLoading && <p>Loading your profile…</p>}
          <Routes>
            <Route
              path="/"
              element={<Dashboard user={user} profile={profile} />}
            />
            <Route
              path="/jobs"
              element={<JobSearch user={user} profile={profile} />}
            />
            <Route
              path="/experiences"
              element={<ExperienceManager user={user} />}
            />
            <Route
              path="/applications"
              element={<ApplicationTracker user={user} />}
            />
            <Route path="/analytics" element={<AnalyticsPage user={user} />} />
            <Route path="/resumes" element={<ResumeManager user={user} />} />
            <Route
              path="/resume-tailor"
              element={<ResumeTailor user={user} />}
            />
            <Route
              path="/profile"
              element={
                <ProfileSettings
                  user={user}
                  profile={profile}
                  onProfileUpdated={setProfile}
                />
              }
            />
          </Routes>
        </main>
        {showOnboarding && (
          <OnboardingFlow
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        )}
      </div>
    </Router>
  );
}

export default function AppWrapper() {
  return (
    <Authenticator>
      {({ user, signOut }) => <App user={user} signOut={signOut} />}
    </Authenticator>
  );
}

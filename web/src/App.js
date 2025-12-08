import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Amplify, API } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import config from './amplify-config.json';
import Dashboard from './components/Dashboard';
import JobSearch from './components/JobSearch';
import ExperienceManager from './components/ExperienceManager';
import ApplicationTracker from './components/ApplicationTracker';
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
      const createdProfile = await API.get('CareerHelperAPI', `/users/${userId}`);
      return createdProfile;
    }

    throw error;
  }
}

function App({ user, signOut }) {
  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

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
            <Link to="/">Dashboard</Link>
            {' | '}
            <Link to="/jobs">Jobs</Link>
            {' | '}
            <Link to="/experiences">Experiences</Link>
            {' | '}
            <Link to="/applications">Applications</Link>
          </nav>
        </header>
        <main className="App-main">
          {isProfileLoading && <p>Loading your profile…</p>}
          <Routes>
            <Route path="/" element={<Dashboard user={user} profile={profile} />} />
            <Route path="/jobs" element={<JobSearch user={user} />} />
            <Route path="/experiences" element={<ExperienceManager user={user} />} />
            <Route path="/applications" element={<ApplicationTracker user={user} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default function AppWrapper() {
  return (
    <Authenticator>{({ user, signOut }) => <App user={user} signOut={signOut} />}</Authenticator>
  );
}

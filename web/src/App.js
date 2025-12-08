import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import config from './amplify-config.json';
import Dashboard from './components/Dashboard';
import JobSearch from './components/JobSearch';
import ExperienceManager from './components/ExperienceManager';
import ApplicationTracker from './components/ApplicationTracker';

// Configure Amplify
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

function App({ signOut }) {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <div className="App-header-content">
            <h1>CareerHelper</h1>
            <button type="button" onClick={signOut} className="sign-out-btn">
              Sign out
            </button>
          </div>
          <nav>
            <Link to="/">Dashboard</Link> |<Link to="/jobs">Jobs</Link> |
            <Link to="/experiences">Experiences</Link> |
            <Link to="/applications">Applications</Link>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs" element={<JobSearch />} />
            <Route path="/experiences" element={<ExperienceManager />} />
            <Route path="/applications" element={<ApplicationTracker />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
export default function AppWrapper() {
  return (
    <Authenticator>
      {({ signOut }) => <App signOut={signOut} />}
    </Authenticator>
  );
}

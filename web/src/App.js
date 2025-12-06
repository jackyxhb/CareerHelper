import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// Configure Amplify (replace with your config)
Amplify.configure({
  Auth: {
    region: 'us-east-1',
    userPoolId: 'your-user-pool-id',
    userPoolWebClientId: 'your-client-id',
  },
});

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>CareerHelper</h1>
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

function Dashboard() {
  return <h2>Dashboard</h2>;
}

function JobSearch() {
  return <h2>Job Search</h2>;
}

function ExperienceManager() {
  return <h2>Experience Manager</h2>;
}

function ApplicationTracker() {
  return <h2>Application Tracker</h2>;
}

export default withAuthenticator(App);
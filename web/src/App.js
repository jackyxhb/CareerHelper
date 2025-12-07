import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import Dashboard from './components/Dashboard';
import JobSearch from './components/JobSearch';
import ExperienceManager from './components/ExperienceManager';
import ApplicationTracker from './components/ApplicationTracker';

// Configure Amplify
Amplify.configure({
  API: {
    endpoints: [
      {
        name: 'CareerHelperAPI',
        endpoint: 'https://lm5lnut0n5.execute-api.us-east-1.amazonaws.com',
        region: 'us-east-1',
      },
    ],
  },
});

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>CareerHelper</h1>
          <nav>
            <a href="/">Dashboard</a> |<a href="/jobs">Jobs</a> |
            <a href="/experiences">Experiences</a> |
            <a href="/applications">Applications</a>
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

export default App;

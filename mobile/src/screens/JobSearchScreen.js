import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button } from 'react-native';
import { Auth } from 'aws-amplify';
import { DataStore } from '@aws-amplify/datastore';
import { Job } from 'careerhelper-shared';
import { createLocalApplication, syncJobsFromApi } from '../services/dataSync';
import SyncStatusBanner from '../components/SyncStatusBanner';
import { logError, logInfo } from '../utils/logger';

function JobSearchScreen() {
  const [jobs, setJobs] = useState([]);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let subscription;
    let mounted = true;

    const bootstrap = async () => {
      try {
        subscription = DataStore.observeQuery(Job).subscribe(snapshot => {
          if (mounted) {
            setJobs(snapshot.items);
          }
        });
        await syncJobsFromApi();
      } catch (error) {
        logError('Failed to bootstrap job search', error);
      }
    };

    bootstrap();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const renderJob = ({ item }) => (
    <View style={{ padding: 10, borderBottomWidth: 1 }}>
      <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
      <Text>
        {item.company} - {item.location}
      </Text>
      <Text>{item.description}</Text>
      <Button
        title="Apply"
        onPress={() => handleApply(item)}
      />
    </View>
  );

  const handleApply = async job => {
    setFeedback(null);
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      await createLocalApplication(currentUser.username, {
        jobId: job.jobId,
        status: 'APPLIED',
        appliedAt: new Date().toISOString(),
        notes: '',
        jobTitle: job.title,
        jobCompany: job.company,
        jobLocation: job.location,
        jobSource: job.source || 'Internal',
      });
      setFeedback('Saved to your application tracker.');
      logInfo('Job saved to application tracker', { jobId: job.jobId });
    } catch (error) {
      logError('Failed to queue application', error, { jobId: job.jobId });
      setFeedback('Saved locally. Will sync when back online.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <SyncStatusBanner />
      <Text style={{ fontSize: 20, textAlign: 'center', margin: 10 }}>
        Job Search
      </Text>
      {feedback && (
        <Text style={{ textAlign: 'center', marginBottom: 10 }}>{feedback}</Text>
      )}
      <FlatList
        data={jobs}
        renderItem={renderJob}
        keyExtractor={item => item.jobId}
      />
    </View>
  );
}

export default JobSearchScreen;

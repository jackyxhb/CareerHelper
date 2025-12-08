import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { Auth } from 'aws-amplify';
import { DataStore } from '@aws-amplify/datastore';
import { Application, Job } from 'careerhelper-shared';
import SyncStatusBanner from '../components/SyncStatusBanner';
import { syncApplicationsFromApi } from '../services/dataSync';
import { logError } from '../utils/logger';

function ApplicationScreen() {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  useEffect(() => {
    let applicationSubscription;
    let jobSubscription;
    let mounted = true;

    const bootstrap = async () => {
      try {
        const currentUser = await Auth.currentAuthenticatedUser();
        if (!mounted) {
          return;
        }

        applicationSubscription = DataStore.observeQuery(Application, app =>
          app.userId('eq', currentUser.username)
        ).subscribe(snapshot => {
          if (mounted) {
            setApplications(snapshot.items);
          }
        });

        jobSubscription = DataStore.observeQuery(Job).subscribe(snapshot => {
          if (mounted) {
            setJobs(snapshot.items);
          }
        });

        await syncApplicationsFromApi(currentUser.username);
      } catch (error) {
        logError('Failed to bootstrap applications', error);
      }
    };

    bootstrap();

    return () => {
      mounted = false;
      applicationSubscription?.unsubscribe();
      jobSubscription?.unsubscribe();
    };
  }, []);

  const jobLookup = useMemo(() => {
    const lookup = new Map();
    jobs.forEach(job => {
      if (job.jobId) {
        lookup.set(job.jobId, job);
      }
    });
    return lookup;
  }, [jobs]);

  const renderApplication = ({ item }) => {
    const jobRecord = jobLookup.get(item.jobId);
    const title = jobRecord?.title || item.jobTitle || 'Unknown Job';
    const company = jobRecord?.company || item.jobCompany;
    const location = jobRecord?.location || item.jobLocation;

    return (
      <View style={{ padding: 10, borderBottomWidth: 1 }}>
        <Text style={{ fontWeight: 'bold' }}>{title}</Text>
        {company && <Text>{company}</Text>}
        {location && <Text>{location}</Text>}
        <Text>Job ID: {item.jobId}</Text>
        <Text>Status: {item.status}</Text>
        <Text>Applied: {new Date(item.appliedAt).toLocaleDateString()}</Text>
        {item.notes && <Text>Notes: {item.notes}</Text>}
        {item.pendingSync && (
          <Text style={{ color: '#b45309' }}>Awaiting sync…</Text>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <SyncStatusBanner />
      <Text style={{ fontSize: 20, textAlign: 'center', margin: 10 }}>
        Application Tracker
      </Text>
      <FlatList
        data={applications}
        renderItem={renderApplication}
        keyExtractor={item => item.applicationId}
        extraData={jobLookup}
      />
    </View>
  );
}

export default ApplicationScreen;

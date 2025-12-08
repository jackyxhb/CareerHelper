import React, { useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import { Auth } from 'aws-amplify';
import { DataStore } from '@aws-amplify/datastore';
import { Application } from 'careerhelper-shared';
import SyncStatusBanner from '../components/SyncStatusBanner';
import { syncApplicationsFromApi } from '../services/dataSync';
import { logError } from '../utils/logger';

function ApplicationScreen() {
  const [applications, setApplications] = useState([]);
  useEffect(() => {
    let subscription;
    let mounted = true;

    const bootstrap = async () => {
      try {
        const currentUser = await Auth.currentAuthenticatedUser();
        if (!mounted) {
          return;
        }

        subscription = DataStore.observeQuery(Application, app =>
          app.userId('eq', currentUser.username)
        ).subscribe(snapshot => {
          if (mounted) {
            setApplications(snapshot.items);
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
      subscription?.unsubscribe();
    };
  }, []);

  const renderApplication = ({ item }) => (
    <View style={{ padding: 10, borderBottomWidth: 1 }}>
      <Text style={{ fontWeight: 'bold' }}>Job ID: {item.jobId}</Text>
      <Text>Status: {item.status}</Text>
      <Text>Applied: {new Date(item.appliedAt).toLocaleDateString()}</Text>
      {item.notes && <Text>Notes: {item.notes}</Text>}
      {item.pendingSync && (
        <Text style={{ color: '#b45309' }}>Awaiting sync…</Text>
      )}
    </View>
  );

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
      />
    </View>
  );
}

export default ApplicationScreen;

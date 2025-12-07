import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { API, Auth } from 'aws-amplify';

function ApplicationScreen() {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      const applicationsData = await API.get(
        'CareerHelperAPI',
        `/applications/${currentUser.username}`
      );
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const renderApplication = ({ item }) => (
    <View style={{ padding: 10, borderBottomWidth: 1 }}>
      <Text style={{ fontWeight: 'bold' }}>Job ID: {item.jobId}</Text>
      <Text>Status: {item.status}</Text>
      <Text>Applied: {new Date(item.appliedAt).toLocaleDateString()}</Text>
      {item.notes && <Text>Notes: {item.notes}</Text>}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
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

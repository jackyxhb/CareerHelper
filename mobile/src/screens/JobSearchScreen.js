import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button } from 'react-native';
import { API } from 'aws-amplify';

function JobSearchScreen() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const jobsData = await API.get('CareerHelperAPI', '/jobs');
      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const renderJob = ({ item }) => (
    <View style={{ padding: 10, borderBottomWidth: 1 }}>
      <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
      <Text>
        {item.company} - {item.location}
      </Text>
      <Text>{item.description}</Text>
      <Button
        title="Apply"
        onPress={() => {
          /* Handle apply */
        }}
      />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 20, textAlign: 'center', margin: 10 }}>
        Job Search
      </Text>
      <FlatList
        data={jobs}
        renderItem={renderJob}
        keyExtractor={item => item.jobId}
      />
    </View>
  );
}

export default JobSearchScreen;

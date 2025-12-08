import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { Auth } from 'aws-amplify';
import { logError } from '../utils/logger';

function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      setUser(currentUser);
    } catch (error) {
      logError('Failed to fetch current user', error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>CareerHelper Dashboard</Text>
      {user && <Text>Welcome, {user.attributes.email}!</Text>}
      <Button
        title="Search Jobs"
        onPress={() => navigation.navigate('JobSearch')}
      />
      <Button
        title="Manage Experience"
        onPress={() => navigation.navigate('Experience')}
      />
      <Button
        title="Track Applications"
        onPress={() => navigation.navigate('Application')}
      />
    </View>
  );
}

export default DashboardScreen;

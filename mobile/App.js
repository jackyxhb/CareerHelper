import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Amplify } from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react-native';
import { DataStore } from '@aws-amplify/datastore';
import { Alert, Button } from 'react-native';
import DashboardScreen from './src/screens/DashboardScreen';
import JobSearchScreen from './src/screens/JobSearchScreen';
import ExperienceScreen from './src/screens/ExperienceScreen';
import ApplicationScreen from './src/screens/ApplicationScreen';
import { flushPendingChanges, syncJobsFromApi } from './src/services/dataSync';
import { logError } from './src/utils/logger';
import config from './src/config/amplify-config.json';

// Configure Amplify
Amplify.configure({
  Auth: {
    region: config.region,
    userPoolId: config.userPoolId,
    userPoolWebClientId: config.userPoolWebClientId,
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
  DataStore: {
    conflictHandler: async data => {
      Alert.alert(
        'Sync conflict detected',
        'A newer cloud version was detected. Keeping the latest cloud update.'
      );
      return data.remoteModel;
    },
    errorHandler: error => {
      logError('DataStore encountered an error', error);
    },
  },
});

const Stack = createStackNavigator();

function Navigator({ onSignOut, user }) {
  useEffect(() => {
    if (user?.username) {
      flushPendingChanges(user.username);
      syncJobsFromApi();
    }
  }, [user?.username]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerRight: () => (
            <Button title="Sign out" onPress={onSignOut} color="#ef4444" />
          ),
        }}
      >
        <Stack.Screen name="Dashboard">
          {props => <DashboardScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="JobSearch">
          {props => <JobSearchScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Experience">
          {props => <ExperienceScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Application">
          {props => <ApplicationScreen {...props} user={user} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AppWrapper({ signOut, user }) {
  const handleSignOut = async () => {
    try {
      await DataStore.clear();
    } catch (error) {
      logError('Failed to clear DataStore during sign out', error);
    } finally {
      await signOut();
    }
  };

  return <Navigator user={user} onSignOut={handleSignOut} />;
}

export default withAuthenticator(AppWrapper);
